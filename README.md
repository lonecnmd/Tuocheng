# 佗城三维可视化平台

基于 Vue 3、Vite、Cesium 和 ECharts 的佗城建筑与三维场景可视化项目。当前版本包含场景浏览、建筑档案、参与项目展示和演示登录界面。

## 运行环境

- Node.js 和 npm（请使用与 `web/package-lock.json` 兼容的版本）
- 可选：天地图和 Cesium ion 服务令牌

## 本地运行

```bash
cd web
cp .env.example .env.local
npm ci
npm run dev
```

在 Windows CMD 中可用 `copy .env.example .env.local`。启动后访问终端显示的本地地址。没有服务令牌时，影像会使用代码中的备用底图，地形会退回平面椭球。

构建与预览：

```bash
cd web
npm run build
npm run preview
```

## 数据与模型

此仓库计划只发布代码和经授权的小型展示资源。原始测绘数据、三维瓦片和建筑模型未包含在仓库中。若要显示完整三维场景，请自行准备数据，并放在项目根目录的 `data_tiles/full/tileset.json` 和 `data_mode/` 中。应用在开发及本地预览时分别通过 `/tiles` 和 `/models` 访问这两个目录；相关配置见 `web/vite.config.js`、`web/src/config/scene.js` 和 `web/src/config/buildingModels.js`。

`web/public/` 内还有地图及建筑展示数据、图片。公开前请逐项核对来源、授权和个人信息。没有本地瓦片及模型时，页面可以启动，但相关三维内容不会完整显示。演示登录仅用于展示界面，不提供真实身份验证。

## 开源许可

尚未确定。发布前请确认代码、图片、数据及模型各自的权利归属，并为可开源的部分添加合适的 `LICENSE` 文件。公开可见不等于已授予他人使用、修改和再分发的权利。
