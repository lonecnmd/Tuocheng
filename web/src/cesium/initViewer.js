import * as Cesium from 'cesium'

/** 天地图影像 + 注记（Web 墨卡托） */
function createTiandituProviders(token) {
  const make = (layer) =>
    new Cesium.WebMapTileServiceImageryProvider({
      url: `https://t{s}.tianditu.gov.cn/${layer}_w/wmts?tk=${token}`,
      layer,
      style: 'default',
      format: 'tiles',
      tileMatrixSetID: 'w',
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      tilingScheme: new Cesium.WebMercatorTilingScheme(),
      minimumLevel: 1, // 天地图 w 矩阵集从第 1 级开始，请求第 0 级会返回 400
      maximumLevel: 17,
    })
  return [make('img'), make('cia')]
}

/** 备用底图：ArcGIS 全球影像，无需 Key */
function createArcgisProvider() {
  return new Cesium.UrlTemplateImageryProvider({
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maximumLevel: 18,
  })
}

/** 根据配置创建地形，缺少 Token 时退回平面椭球 */
function createTerrain(type) {
  const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN
  if (type !== 'ion') return undefined
  if (!ionToken) {
    console.warn('[地形] 未配置 VITE_CESIUM_ION_TOKEN，使用平面椭球')
    return undefined
  }
  Cesium.Ion.defaultAccessToken = ionToken
  return Cesium.Terrain.fromWorldTerrain()
}

export function createViewer(container, { debug = false, terrain = 'none' } = {}) {
  const viewer = new Cesium.Viewer(container, {
    baseLayer: false, // 不使用 Cesium ion 默认底图
    terrain: createTerrain(terrain),
    animation: false,
    timeline: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    baseLayerPicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
  })

  const token = import.meta.env.VITE_TDT_TOKEN
  const providers = token ? createTiandituProviders(token) : [createArcgisProvider()]
  providers.forEach((p) => viewer.imageryLayers.addImageryProvider(p))

  const scene = viewer.scene
  scene.globe.depthTestAgainstTerrain = true // 拾取坐标需要深度检测
  scene.postProcessStages.fxaa.enabled = true
  scene.debugShowFramesPerSecond = debug
    // 关闭默认的双击跟随实体
  viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
  return viewer
}