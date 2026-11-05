import * as Cesium from 'cesium'

const ID_PREFIX = 'building:'
const PITCH = Cesium.Math.toRadians(-30)
const ORBIT_SPEED = 0.0025 // 每帧旋转弧度，60 FPS 时约 40 秒一圈

const COLORS = {
  featured: Cesium.Color.fromCssColorString('#e0b04a').withAlpha(0.18),
  normal: Cesium.Color.fromCssColorString('#9aa4ad').withAlpha(0.08),
  hover: Cesium.Color.fromCssColorString('#ffd36b').withAlpha(0.42),
  selected: Cesium.Color.fromCssColorString('#ff6a3d').withAlpha(0.5),
}

/** 射线法判断点是否在多边形内（经纬度平面，街区尺度误差可忽略） */
function pointInRing(x, y, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/**
 * 建筑图层：用 ClassificationPrimitive 把描边体块"染色"到倾斜模型上，
 * 实现单体高亮，不需要切割模型。
 */
export class BuildingLayer {
  constructor(viewer) {
    this.viewer = viewer
    this.items = new Map()
    this.hoverId = null
    this.selectedId = null
    this._token = 0
    this._removeOrbit = null
    this._orbitHandler = null
    this._removeReadyCheck = null
  }

  load(features, infoMap = {}) {
    this.clear()
    for (const f of features) {
      const p = f.properties
      const ring = f.geometry.coordinates[0].slice(0, -1) // 去掉闭合点
      const lon = ring.reduce((s, c) => s + c[0], 0) / ring.length
      const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length
      const baseColor = infoMap[p.id]?.featured ? COLORS.featured : COLORS.normal

      const primitive = new Cesium.ClassificationPrimitive({
        geometryInstances: new Cesium.GeometryInstance({
          id: ID_PREFIX + p.id,
          geometry: new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(
              Cesium.Cartesian3.fromDegreesArray(ring.flatMap(([x, y]) => [x, y])),
            ),
            height: p.baseHeight,
            extrudedHeight: p.topHeight,
          }),
          attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(baseColor) },
        }),
        classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
      })
      this.viewer.scene.primitives.add(primitive)

      const corners = ring.flatMap(([x, y]) => [x, y, p.baseHeight, x, y, p.topHeight])
      this.items.set(p.id, {
        ring,
        props: p,
        primitive,
        baseColor,
        anchor: Cesium.Cartesian3.fromDegrees(lon, lat, p.topHeight), // 标签锚点：屋顶中心
        sphere: Cesium.BoundingSphere.fromPoints(Cesium.Cartesian3.fromDegreesArrayHeights(corners)),
      })
    }

    // 几何体是异步生成的，全部就绪后统一刷新一次颜色
    this._removeReadyCheck = this.viewer.scene.postRender.addEventListener(() => {
      for (const it of this.items.values()) if (!it.primitive.ready) return
      this._removeReadyCheck()
      this._removeReadyCheck = null
      for (const id of this.items.keys()) this._refresh(id)
    })
  }

  getAnchor(id) {
    return this.items.get(id)?.anchor
  }

  boundingSphereOf(ids) {
    const spheres = ids.map((id) => this.items.get(id)?.sphere).filter(Boolean)
    return spheres.length ? Cesium.BoundingSphere.fromBoundingSpheres(spheres) : undefined
  }

  /** 屏幕坐标 -> 建筑编号：取模型表面点，判断落在哪个体块内 */
  pickAt(windowPosition) {
    const scene = this.viewer.scene
    if (!scene.pickPositionSupported) return null
    const pos = scene.pickPosition(windowPosition)
    if (!Cesium.defined(pos)) return null
    const c = Cesium.Cartographic.fromCartesian(pos)
    const lon = Cesium.Math.toDegrees(c.longitude)
    const lat = Cesium.Math.toDegrees(c.latitude)
    for (const [id, it] of this.items) {
      if (c.height < it.props.baseHeight || c.height > it.props.topHeight) continue
      if (pointInRing(lon, lat, it.ring)) return id
    }
    return null
  }

  setHover(id) {
    if (id === this.hoverId) return
    const prev = this.hoverId
    this.hoverId = id
    this._refresh(prev)
    this._refresh(id)
  }

  select(id) {
    if (id === this.selectedId) return
    const prev = this.selectedId
    this.selectedId = id
    this._refresh(prev)
    this._refresh(id)
  }

  _refresh(id) {
    const it = id && this.items.get(id)
    if (!it || !it.primitive.ready) return
    const color = id === this.selectedId ? COLORS.selected : id === this.hoverId ? COLORS.hover : it.baseColor
    const attrs = it.primitive.getGeometryInstanceAttributes(ID_PREFIX + id)
    attrs.color = Cesium.ColorGeometryInstanceAttribute.toValue(color, attrs.color)
  }

  /** 飞到建筑；orbit 为 true 时到达后自动环绕 */
  focus(id, { orbit = false, rangeMultiplier = 3.2, minRange = 50 } = {}) {
    const it = this.items.get(id)
    if (!it) return
    this.stopOrbit()
    const token = ++this._token
    const heading = this.viewer.camera.heading
    const range = Math.max(it.sphere.radius * rangeMultiplier, minRange)
    this.viewer.camera.flyToBoundingSphere(it.sphere, {
      duration: 1.4,
      offset: new Cesium.HeadingPitchRange(heading, PITCH, range),
      complete: () => {
        // 飞行期间若已离开档案页，token 会变化，不再启动环绕
        if (orbit && token === this._token) this._startOrbit(it, heading, range)
      },
    })
  }

  _startOrbit(it, heading, range) {
    const camera = this.viewer.camera
    const hpr = new Cesium.HeadingPitchRange(heading, PITCH, range)
    this._removeOrbit = this.viewer.scene.preRender.addEventListener(() => {
      hpr.heading += ORBIT_SPEED
      camera.lookAt(it.sphere.center, hpr)
    })

    // 用户拖动或滚轮时停止环绕，交还相机控制
    this._orbitHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
    const stop = () => setTimeout(() => this.stopOrbit(), 0) // 不在事件回调内销毁 handler
    const T = Cesium.ScreenSpaceEventType
    for (const type of [T.LEFT_DOWN, T.RIGHT_DOWN, T.MIDDLE_DOWN, T.WHEEL]) {
      this._orbitHandler.setInputAction(stop, type)
    }
  }

  stopOrbit() {
    this._token++
    if (this._removeOrbit) {
      this._removeOrbit()
      this._removeOrbit = null
      if (!this.viewer.isDestroyed()) this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
    }
    if (this._orbitHandler) {
      this._orbitHandler.destroy()
      this._orbitHandler = null
    }
  }

  clear() {
    this.stopOrbit()
    this._removeReadyCheck?.()
    this._removeReadyCheck = null
    for (const it of this.items.values()) this.viewer.scene.primitives.remove(it.primitive)
    this.items.clear()
    this.hoverId = null
    this.selectedId = null
  }

  destroy() {
    if (this.viewer.isDestroyed()) return
    this.clear()
  }
}
