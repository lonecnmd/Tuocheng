import * as Cesium from 'cesium'

const RED = Cesium.Color.fromCssColorString('#a33a2b')
const GOLD = Cesium.Color.fromCssColorString('#e0b04a')

/** Cartesian3 -> [经度, 纬度, 椭球高] */
export function toLonLatH(cartesian) {
  const c = Cesium.Cartographic.fromCartesian(cartesian)
  return [Cesium.Math.toDegrees(c.longitude), Cesium.Math.toDegrees(c.latitude), c.height]
}

/**
 * 建筑描边工具
 * - 描边：在模型表面逐点点击，生成多边形轮廓
 * - 拾取高度：单次点击读取高度，用于设置建筑底部/顶部
 * - 已保存建筑：以半透明体块显示，预览后续点击高亮的范围
 */
export class OutlineTool {
  constructor(viewer) {
    this.viewer = viewer
    this.positions = []
    this.pointEntities = []
    this.drawing = false
    this.pendingPick = null
    this.onPointsChange = () => {}

    this.drawLayer = new Cesium.CustomDataSource('outline-draw')
    this.savedLayer = new Cesium.CustomDataSource('outline-saved')
    viewer.dataSources.add(this.drawLayer)
    viewer.dataSources.add(this.savedLayer)
    this._createPreview()

    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    this.handler.setInputAction((e) => this._onClick(e.position), Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }

  /** 描边过程中的实时预览：闭合折线 + 半透明面 */
  _createPreview() {
    const ring = () => (this.positions.length >= 3 ? [...this.positions, this.positions[0]] : this.positions)

    this.drawLayer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(ring, false),
        width: 3,
        material: GOLD,
        depthFailMaterial: GOLD.withAlpha(0.5), // 被模型遮挡时也能看到
      },
    })
    this.drawLayer.entities.add({
      polygon: {
        show: new Cesium.CallbackProperty(() => this.positions.length >= 3, false),
        hierarchy: new Cesium.CallbackProperty(() => new Cesium.PolygonHierarchy(this.positions), false),
        perPositionHeight: true,
        material: GOLD.withAlpha(0.25),
      },
    })
  }

  _onClick(screenPosition) {
    if (!this.drawing && !this.pendingPick) return
    const position = this.viewer.scene.pickPosition(screenPosition)
    if (!Cesium.defined(position)) return

    // 单次拾取高度
    if (this.pendingPick) {
      const callback = this.pendingPick
      this.pendingPick = null
      callback(toLonLatH(position)[2])
      return
    }

    this.positions.push(position)
    this.pointEntities.push(
      this.drawLayer.entities.add({
        position,
        point: {
          pixelSize: 9,
          color: GOLD,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      }),
    )
    this.onPointsChange(this.positions.length)
  }

  start() {
    this.cancel()
    this.drawing = true
  }

  undo() {
    if (!this.positions.length) return
    this.positions.pop()
    this.drawLayer.entities.remove(this.pointEntities.pop())
    this.onPointsChange(this.positions.length)
  }

  cancel() {
    this.pointEntities.forEach((e) => this.drawLayer.entities.remove(e))
    this.pointEntities = []
    this.positions = []
    this.drawing = false
    this.onPointsChange(0)
  }

  /** 结束描边，返回轮廓坐标和点的高度范围；点数不足返回 null */
  finish() {
    if (this.positions.length < 3) return null
    const coords = this.positions.map(toLonLatH)
    const heights = coords.map((c) => c[2])
    const result = {
      ring: coords.map(([lon, lat]) => [Number(lon.toFixed(7)), Number(lat.toFixed(7))]),
      minHeight: Math.min(...heights),
      maxHeight: Math.max(...heights),
    }
    this.cancel()
    return result
  }

  /** 下一次点击只读取高度，不添加描边点 */
  pickHeight(callback) {
    this.pendingPick = callback
  }

  /** 把已保存的 GeoJSON 要素显示为半透明体块 */
  renderSaved(features) {
    const entities = this.savedLayer.entities
    entities.removeAll()

    for (const f of features) {
      const { id, name, baseHeight, topHeight } = f.properties
      const ring = f.geometry.coordinates[0].slice(0, -1) // 去掉闭合的最后一个点
      const lon = ring.reduce((s, p) => s + p[0], 0) / ring.length
      const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length

      entities.add({
        id: `building-${id}`,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, topHeight),
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(ring.flatMap((p) => [p[0], p[1]]))),
          height: baseHeight,
          extrudedHeight: topHeight,
          material: RED.withAlpha(0.3),
          outline: true,
          outlineColor: RED,
        },
        label: {
          text: name,
          font: '14px "Microsoft YaHei"',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -6),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })
    }
  }

  flyTo(id) {
    const entity = this.savedLayer.entities.getById(`building-${id}`)
    if (!entity) return
    this.viewer.flyTo(entity, {
      duration: 1.2,
      offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-50), 80),
    })
  }

  destroy() {
    this.handler.destroy()
    if (!this.viewer.isDestroyed()) {
      this.viewer.dataSources.remove(this.drawLayer, true)
      this.viewer.dataSources.remove(this.savedLayer, true)
    }
  }
}