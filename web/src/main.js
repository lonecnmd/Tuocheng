import { createApp } from 'vue'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import './styles/theme.css'
import './styles/fluid.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
