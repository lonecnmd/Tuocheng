import * as Cesium from 'cesium'

export async function loadTileset(viewer, url, { heightOffset = 0, maximumScreenSpaceError = 16 } = {}) {
  const tileset = await Cesium.Cesium3DTileset.fromUrl(url, {
    maximumScreenSpaceError,
    // 关闭动态误差：街区范围小，避免斜视时远处建筑被主动降精度
    dynamicScreenSpaceError: false,
  })
  viewer.scene.primitives.add(tileset)
  setHeightOffset(tileset, heightOffset)
  return tileset
}

/**
 * 沿模型中心的法线方向整体平移，offset 为绝对值，不会叠加。
 * 用于修正 1985 高程与椭球高的差异。
 */
export function setHeightOffset(tileset, offset) {
  const c = Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center)
  const surface = Cesium.Cartesian3.fromRadians(c.longitude, c.latitude, 0)
  const target = Cesium.Cartesian3.fromRadians(c.longitude, c.latitude, offset)
  const translation = Cesium.Cartesian3.subtract(target, surface, new Cesium.Cartesian3())
  tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation)
}