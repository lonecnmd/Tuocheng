import * as Cesium from 'cesium'
import { BUILDING_MODELS } from '../config/buildingModels'

const STORAGE_KEY = 'tuocheng-building-model-adjustments-v1'
const DEFAULTS = { heading: 0, pitch: 0, roll: 0, scale: 1, east: 0, north: 0, height: 0 }

function readSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

/** 将两个独立模型放在建筑足迹中心，按足迹大小适配占位素材的原始比例。 */
export async function loadBuildingModels(viewer, features) {
  const byId = new Map(features.map((feature) => [feature.properties.id, feature]))
  const models = new Map()
  const saved = readSaved()
  const controller = {
    get(id) { return models.get(id)?.adjustment ?? null },
    focus(id) {
      const model = models.get(id)?.model
      if (model) viewer.camera.flyToBoundingSphere(model.boundingSphere, {
        duration: 1.2,
        offset: new Cesium.HeadingPitchRange(viewer.camera.heading, Cesium.Math.toRadians(-30), Math.max(model.boundingSphere.radius * 3, 45)),
      })
    },
    update(id, changes) {
      const item = models.get(id)
      if (!item) return
      item.adjustment = { ...item.adjustment, ...changes }
      const a = item.adjustment
      const origin = Cesium.Cartesian3.fromDegrees(item.lon, item.lat, item.centerHeight)
      const localFrame = Cesium.Transforms.eastNorthUpToFixedFrame(origin)
      const target = Cesium.Matrix4.multiplyByPoint(
        localFrame, new Cesium.Cartesian3(a.east, a.north, a.height), new Cesium.Cartesian3(),
      )
      const frame = Cesium.Transforms.headingPitchRollToFixedFrame(target, new Cesium.HeadingPitchRoll(
        Cesium.Math.toRadians(a.heading), Cesium.Math.toRadians(a.pitch), Cesium.Math.toRadians(a.roll),
      ))
      item.model.scale = item.baseScale * a.scale
      item.model.modelMatrix = frame
      const delta = Cesium.Cartesian3.subtract(target, item.model.boundingSphere.center, new Cesium.Cartesian3())
      item.model.modelMatrix = Cesium.Matrix4.multiply(Cesium.Matrix4.fromTranslation(delta), frame, new Cesium.Matrix4())
    },
    save(id) {
      const adjustment = models.get(id)?.adjustment
      if (!adjustment) return false
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSaved(), [id]: adjustment }))
        return true
      } catch (error) {
        console.warn('模型调节值未能保存到浏览器', error)
        return false
      }
    },
    reset(id) {
      const entry = BUILDING_MODELS.find((item) => item.id === id)
      this.update(id, { ...DEFAULTS, heading: entry?.heading ?? 0 })
    },
  }
  for (const entry of BUILDING_MODELS) {
    const feature = byId.get(entry.id)
    if (!feature) continue
    const ring = feature.geometry.coordinates[0].slice(0, -1)
    const lon = ring.reduce((sum, point) => sum + point[0], 0) / ring.length
    const lat = ring.reduce((sum, point) => sum + point[1], 0) / ring.length
    const centerHeight = (feature.properties.baseHeight + feature.properties.topHeight) / 2
    const target = Cesium.Cartesian3.fromDegrees(lon, lat, centerHeight)
    const frame = Cesium.Transforms.eastNorthUpToFixedFrame(target)

    try {
      const model = await Cesium.Model.fromGltfAsync({
        url: `/models/${encodeURIComponent(entry.file)}`,
        modelMatrix: frame,
      })
      if (viewer.isDestroyed()) { model.destroy(); return controller }
      viewer.scene.primitives.add(model)
      await new Promise((resolve, reject) => {
        if (model.ready) { resolve(); return }
        const removeReady = model.readyEvent.addEventListener(() => {
          removeError()
          resolve()
        })
        const removeError = model.errorEvent.addEventListener((error) => {
          removeReady()
          reject(error)
        })
      })
      if (viewer.isDestroyed()) return controller
      models.set(entry.id, {
        model, lon, lat, centerHeight,
        baseScale: entry.radius / model.boundingSphere.radius,
        adjustment: { ...DEFAULTS, heading: entry.heading },
      })
      const prior = saved[entry.id] ?? {}
      controller.update(entry.id, Object.fromEntries(Object.keys(DEFAULTS).map((key) => [
        key, Number.isFinite(Number(prior[key])) ? Number(prior[key]) : (key === 'heading' ? entry.heading : DEFAULTS[key]),
      ])))
    } catch (error) {
      console.error(`建筑模型加载失败：${entry.file}：${error?.message ?? error}`)
    }
  }
  return controller
}
