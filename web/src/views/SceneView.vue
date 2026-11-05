<script setup>
import { computed, onBeforeUnmount, provide, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as Cesium from 'cesium'
import CesiumViewer from '../components/CesiumViewer.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import UiIcon from '../components/layout/UiIcon.vue'
import BottomNav from '../components/layout/BottomNav.vue'
import PanelCard from '../components/layout/PanelCard.vue'
import OverviewPanel from '../components/panels/OverviewPanel.vue'
import LocationPanel from '../components/panels/LocationPanel.vue'
import ArchiveProgressPanel from '../components/panels/ArchiveProgressPanel.vue'
import BuildingListPanel from '../components/panels/BuildingListPanel.vue'
import ActivityPanel from '../components/panels/ActivityPanel.vue'
import ParticipationProjectsPanel from '../components/panels/ParticipationProjectsPanel.vue'
import ParticipationBoard from '../components/panels/ParticipationBoard.vue'
import BuildingMarkers from '../components/scene/BuildingMarkers.vue'
import BuildingPopup from '../components/scene/BuildingPopup.vue'
import DebugPanel from '../components/tools/DebugPanel.vue'
import BuildingModelAdjuster from '../components/tools/BuildingModelAdjuster.vue'
import OutlineTool from '../components/tools/OutlineTool.vue'
import { BuildingLayer } from '../cesium/buildingLayer'
import { loadBuildingModels } from '../cesium/buildingModels'
import { fetchSite, fetchBuildingGeo, fetchBuildingInfo } from '../api/data'

defineEmits(['logout'])

const PLANNED = {
  ai: {
    title: 'AI 问答',
    en: 'AI Assistant',
    desc: '以建筑档案为知识库，回答历史、家族与建筑相关的问题。',
    items: ['基于档案检索的问答（RAG），回答附出处', '口述录音转写与摘要', '接入 DeepSeek / 通义千问，Key 只存放在后端', '扩展：人物、家族、建筑知识图谱'],
  },
  economy: { title: '经济运行', en: 'Economy', desc: '展示街区经营活力、商户分布与客流变化。', items: ['街区商户与业态分布', '经营趋势与客流变化', '重点项目进展'] },
  tourism: { title: '农文旅游', en: 'Culture & Tourism', desc: '汇集古城文化资源、乡村游线与游客体验。', items: ['历史建筑与非遗资源', '农文旅线路及节点', '活动与游客反馈'] },
  ecology: { title: '生态监测', en: 'Ecology', desc: '展示街区环境与周边生态指标。', items: ['绿地与水系分布', '环境监测趋势', '生态保护动态'] },
}

const route = useRoute()
const router = useRouter()

// Cesium 对象用 shallowRef：只追踪引用，不做深度代理
const viewerRef = shallowRef(null)
const tilesetRef = shallowRef(null)
const layerRef = shallowRef(null)
const modelControllerRef = shallowRef(null)
provide('viewer', viewerRef)
provide('tileset', tilesetRef)

const site = ref(null)
const buildings = ref([])
const ready = ref(false)
const errorMsg = ref('')
const mode = ref('overview')
const panelsVisible = ref(true)
const displayMode = ref('standard')
provide('displayMode', displayMode)
const selectedId = ref(null)
const participationBuildingId = ref('house04')
const participationTopic = ref('entrance')
let handler = null

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const detailId = computed(() => (route.name === 'building' ? String(route.params.id) : null))
const featured = computed(() => buildings.value.filter((b) => b.featured))
const selected = computed(() => buildings.value.find((b) => b.id === selectedId.value) ?? null)
const participationBuilding = computed(() => featured.value.find((b) => b.id === participationBuildingId.value) ?? featured.value[0] ?? null)
const pickEnabled = computed(() => ready.value && mode.value !== 'tools' && !detailId.value)
const showLeft = computed(() => panelsVisible.value && ['overview', 'participate', 'tools'].includes(mode.value))
const planned = computed(() => PLANNED[mode.value])

fetchSite()
  .then((s) => (site.value = s))
  .catch((e) => (errorMsg.value = e.message))

async function onReady({ viewer, tileset }) {
  viewerRef.value = viewer
  tilesetRef.value = tileset
  try {
    const [geo, info] = await Promise.all([fetchBuildingGeo(), fetchBuildingInfo()])
    buildings.value = geo.features.map((f) => ({ ...f.properties, ...(info[f.properties.id] ?? {}), id: f.properties.id }))
    const layer = new BuildingLayer(viewer)
    layer.load(geo.features, info)
    layerRef.value = layer
    void loadBuildingModels(viewer, geo.features).then((controller) => { modelControllerRef.value = controller })
  } catch (e) {
    errorMsg.value = `建筑数据加载失败：${e.message}`
  }
  bindEvents(viewer)
  ready.value = true
  if (detailId.value) enterDetail(detailId.value)
  else flyHome(0)
}

function bindEvents(viewer) {
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  let last = 0

  handler.setInputAction((e) => {
    if (!pickEnabled.value || !layerRef.value) return
    const now = performance.now()
    if (now - last < 60) return // 节流，拾取有一定开销
    last = now
    const id = layerRef.value.pickAt(e.endPosition)
    layerRef.value.setHover(id)
    viewer.scene.canvas.style.cursor = id ? 'pointer' : ''
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

  handler.setInputAction((e) => {
    if (!pickEnabled.value || !layerRef.value) return
    const id = layerRef.value.pickAt(e.position)
    if (id) selectBuilding(id)
    else selectedId.value = null
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

/** 初始视角：框住所有重点建筑；没有重点建筑时框住整个模型 */
function flyHome(duration = 1.5) {
  const viewer = viewerRef.value
  if (!viewer) return
  const layer = layerRef.value
  layer?.stopOrbit()
  const sphere = layer?.boundingSphereOf(featured.value.map((b) => b.id)) ?? tilesetRef.value?.boundingSphere
  if (!sphere) return
  viewer.camera.flyToBoundingSphere(sphere, {
    duration,
    offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-40), Math.max(sphere.radius * 2.6, 300)),
  })
}

function selectBuilding(id) {
  selectedId.value = id
  if (mode.value === 'participate' && featured.value.some((b) => b.id === id)) participationBuildingId.value = id
  layerRef.value?.focus(id, mode.value === 'participate' ? { rangeMultiplier: 6, minRange: 160 } : {})
}

function openDetail(id) {
  router.push({ name: 'building', params: { id } })
}

function enterDetail(id) {
  selectedId.value = id
  layerRef.value?.setHover(null)
  viewerRef.value.scene.canvas.style.cursor = ''
  layerRef.value?.focus(id, { orbit: !reduceMotion })
}

watch(selectedId, (id) => layerRef.value?.select(id))

watch(detailId, (id, old) => {
  if (!ready.value) return
  if (id) enterDetail(id)
  else if (old) layerRef.value?.stopOrbit()
})

watch(mode, (m) => {
  if (m === 'tools') {
    selectedId.value = null
    layerRef.value?.setHover(null)
  }
  if (m === 'participate' && participationBuilding.value) selectBuilding(participationBuilding.value.id)
})

onBeforeUnmount(() => {
  handler?.destroy()
  layerRef.value?.destroy()
})
</script>

<template>
  <div class="scene-view" :data-display="displayMode">
    <CesiumViewer @ready="onReady" @error="(e) => (errorMsg = `模型加载失败：${e.message}`)" />

    <AppHeader v-if="site" :title="site.title" :subtitle="site.subtitle" :location="site.location">
      <template #left>
        <button type="button" class="btn" :disabled="!ready" @click="flyHome()"><UiIcon name="home" />复位视角</button>
        <button type="button" class="btn" :aria-pressed="!panelsVisible" @click="panelsVisible = !panelsVisible">
          <UiIcon name="panels" />{{ panelsVisible ? '隐藏面板' : '显示面板' }}
        </button>
        <button type="button" class="btn display-toggle" :aria-pressed="displayMode === 'presentation'"
          title="同步放大文字、图标和图表，适合投影展示"
          @click="displayMode = displayMode === 'standard' ? 'presentation' : 'standard'">
          <span aria-hidden="true">A<span class="type-plus">+</span></span>投影大字
        </button>
        <button type="button" class="btn logout-btn" aria-label="退出演示" title="退出演示" @click="$emit('logout')"><UiIcon name="logout" /></button>
      </template>
    </AppHeader>

    <template v-if="ready && !detailId">
      <BuildingMarkers
        v-if="mode !== 'tools' && layerRef"
        :items="featured"
        :layer="layerRef"
        :selected-id="selectedId"
        @select="selectBuilding"
      />

      <div v-show="panelsVisible" class="panel-layout">
      <Transition name="slide-left">
        <aside v-if="showLeft" class="side side-left">
          <template v-if="mode === 'overview' && site">
            <LocationPanel />
            <OverviewPanel :site="site" />
          </template>
          <ParticipationProjectsPanel v-else-if="mode === 'participate'" :items="featured"
            :building-id="participationBuilding?.id" :topic="participationTopic"
            @select-building="selectBuilding" @select-topic="participationTopic = $event" />
          <template v-else-if="mode === 'tools'">
            <BuildingModelAdjuster :controller="modelControllerRef" />
            <DebugPanel />
          </template>
        </aside>
      </Transition>

      <Transition name="slide-right">
        <aside v-if="panelsVisible" class="side side-right">
          <template v-if="mode === 'overview'">
            <BuildingListPanel :items="featured" :selected-id="selectedId" @locate="selectBuilding" @open="openDetail" />
            <ActivityPanel v-if="site" :site="site" />
          </template>
          <template v-else-if="mode === 'archive'">
          <BuildingListPanel
            title="建筑档案"
            en="Archive"
            :items="buildings"
            :selected-id="selectedId"
            @locate="selectBuilding"
            @open="openDetail"
          />
          <ArchiveProgressPanel v-if="site" :progress="site.progress" />
          </template>
          <ParticipationBoard v-else-if="mode === 'participate'" :building="participationBuilding" :topic="participationTopic"
            @select-topic="participationTopic = $event" />
          <PanelCard v-else-if="planned" :title="planned.title" :en="planned.en">
            <template #extra><span class="mock-tag">规划中</span></template>
            <p class="planned-desc">{{ planned.desc }}</p>
            <ul class="planned-list">
              <li v-for="t in planned.items" :key="t">{{ t }}</li>
            </ul>
          </PanelCard>
          <OutlineTool v-else-if="mode === 'tools'" />
        </aside>
      </Transition>

      </div>

      <BuildingPopup
        v-if="selected && mode !== 'tools' && mode !== 'participate'"
        :building="selected"
        :class="{ shifted: panelsVisible }"
        @open="openDetail"
        @close="selectedId = null"
      />

      <BottomNav v-model="mode" />
    </template>

    <RouterView v-slot="{ Component }">
      <Transition name="fade">
        <component :is="Component" v-if="detailId" />
      </Transition>
    </RouterView>

    <Transition name="fade">
      <div v-if="!ready && !errorMsg" class="loading" role="status" aria-live="polite">
        <span class="loading-seal" aria-hidden="true">佗</span>
        <p>正在加载佗城实景模型…</p>
      </div>
    </Transition>

    <p v-if="errorMsg" class="error-toast" role="alert">{{ errorMsg }}</p>
  </div>
</template>

<style scoped>
.scene-view { position: absolute; inset: 0; font-size: var(--fs-md); }
.scene-view[data-display="presentation"] {
  --fs-xs: 15px; --fs-sm: 17px; --fs-md: 20px; --fs-lg: 22px; --fs-xl: 26px;
  --side-w: clamp(380px, 28vw, 480px); --nav-h: 120px; --header-h: 124px;
}
.panel-layout { position: absolute; inset: 0; z-index: 10; pointer-events: none; }
.display-toggle[aria-pressed="true"] { background: #c2452d55; border-color: var(--gold); color: #fff0d1; }
.type-plus { font-size: .75em; vertical-align: top; }
.scene-view[data-display="presentation"] :deep(.asset-icon),
.scene-view[data-display="presentation"] :deep(.icon-wrap .ui-icon) { width: 38px; height: 38px; }
.scene-view[data-display="presentation"] :deep(.nav-btn .label) { font-size: 20px; }
.scene-view[data-display="presentation"] :deep(.stats .value) { font-size: 30px; }

.side {
  position: absolute;
  top: calc(var(--header-h) + 12px);
  bottom: calc(var(--nav-h) + 20px);
  width: var(--side-w);
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 2px 4px 8px; overflow-y: auto; overflow-x: hidden; pointer-events: auto; overscroll-behavior: contain;
}
.side-left { left: var(--edge-gap); }
.side-right { right: var(--edge-gap); }

.planned-desc { margin: 0 0 10px; line-height: 1.7; color: var(--text-dim); }
.planned-list { margin: 0; padding-left: 18px; line-height: 2; }
.planned-list li::marker { color: var(--vermilion); }

.loading {
  position: absolute; inset: 0; z-index: 50;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
  background: radial-gradient(ellipse at center, #1a1712 0%, var(--ink-900) 70%);
  color: var(--text-dim); letter-spacing: 2px;
}
.loading-seal {
  width: 72px; height: 72px; display: grid; place-items: center;
  background: var(--vermilion); color: #fbe9d0;
  font-family: var(--font-title); font-size: 44px; border-radius: 6px;
  box-shadow: inset 0 0 0 3px rgba(251, 233, 208, 0.6), 0 0 30px rgba(194, 69, 45, 0.5);
  animation: breathe 2s ease-in-out infinite;
}
@keyframes breathe { 50% { transform: scale(1.06); opacity: 0.8; } }

.error-toast {
  position: absolute; left: 50%; top: calc(var(--header-h) + 12px); transform: translateX(-50%);
  z-index: 60; margin: 0; padding: 8px 16px;
  background: rgba(142, 47, 31, 0.92); border: 1px solid var(--gold); border-radius: 3px; color: #fff;
}
@media (max-width: 1100px) {
  .scene-view[data-display="presentation"] { --side-w: 350px; }
}
@media (max-width: 760px) {
  .scene-view[data-display="presentation"] { --header-h: 156px; --nav-h: 100px; }
  .panel-layout { top: calc(var(--header-h) + 10px); bottom: calc(var(--nav-h) + 16px); left: 10px; right: 10px; overflow-y: auto; pointer-events: auto; }
  .side { position: static; width: 100%; padding: 2px 3px 14px; overflow: visible; }
  .scene-view[data-display="presentation"] :deep(.nav-btn) { width: auto; }
  .scene-view[data-display="presentation"] :deep(.nav-btn .label) { font-size: 14px; }
  .scene-view[data-display="presentation"] :deep(.actions .btn) { font-size: 14px; padding: 7px 10px; }
  .scene-view[data-display="presentation"] :deep(.asset-icon),
  .scene-view[data-display="presentation"] :deep(.icon-wrap .ui-icon) { width: 30px; height: 30px; }
}
</style>
