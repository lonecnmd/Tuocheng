import { createRouter, createWebHashHistory } from 'vue-router'

// 三维场景常驻（SceneView），路由只控制叠加在上面的档案页
const routes = [
  { path: '/', name: 'home', component: { render: () => null } },
  {
    path: '/building/:id',
    name: 'building',
    component: () => import('./views/BuildingDetail.vue'),
    props: true,
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

// hash 模式：以后部署到 GitHub Pages 等静态托管不需要服务器配置
const router = createRouter({ history: createWebHashHistory(), routes })

export default router