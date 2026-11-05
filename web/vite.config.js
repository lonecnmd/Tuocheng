import { fileURLToPath, URL } from 'node:url'
import { cpSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import sirv from 'sirv'

const cesiumBaseUrl = 'cesiumStatic'
// Cesium 预编译好的运行文件（Workers、Assets、Widgets、ThirdParty）
const cesiumBuildDir = fileURLToPath(new URL('./node_modules/cesium/Build/Cesium', import.meta.url))
// D:\tuocheng\data_tiles，映射为 /tiles
const tilesDir = fileURLToPath(new URL('../data_tiles', import.meta.url))
// 占位建筑模型保存在 web 外，开发和预览时以 /models 访问。
const modelsDir = fileURLToPath(new URL('../data_mode', import.meta.url))

/** 开发和预览时，把本地文件夹挂到指定 URL 前缀下 */
function serveLocalFolders(mounts) {
  const handlers = Object.entries(mounts).map(([prefix, dir]) => [prefix, sirv(dir, { dev: true })])
  const attach = (server) => handlers.forEach(([prefix, h]) => server.middlewares.use(prefix, h))
  return {
    name: 'serve-local-folders',
    configureServer: attach,
    configurePreviewServer: attach,
  }
}

/** npm run build 时，把 Cesium 运行文件复制到 dist/cesiumStatic */
function copyCesiumOnBuild() {
  let outDir = 'dist'
  return {
    name: 'copy-cesium-on-build',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      for (const dir of ['Workers', 'ThirdParty', 'Assets', 'Widgets']) {
        cpSync(resolve(cesiumBuildDir, dir), resolve(outDir, cesiumBaseUrl, dir), { recursive: true })
      }
    },
  }
}

export default defineConfig({
  base: '/Tuocheng/',
  define: {
    CESIUM_BASE_URL: JSON.stringify(`/Tuocheng/${cesiumBaseUrl}`),
  },
  plugins: [
    vue(),
    serveLocalFolders({
      [`/${cesiumBaseUrl}`]: cesiumBuildDir,
      '/tiles': tilesDir,
      '/models': modelsDir,
    }),
    copyCesiumOnBuild(),
  ],
})
