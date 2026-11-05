<script setup>
import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import PanelCard from '../layout/PanelCard.vue'
import { OutlineTool } from '../../cesium/outlineTool'
import { fetchBuildingGeo } from '../../api/data'
import { SCENE } from '../../config/scene'

const STORAGE_KEY = 'tuocheng.outlines.v1'
const ID_RE = /^[a-z0-9_-]+$/

const viewerRef = inject('viewer')
const features = ref(loadFeatures())
const drawing = ref(false)
const pointCount = ref(0)
const draft = ref(null)
const message = ref('')
let tool = null

const round = (v, n = 2) => Number(Number(v).toFixed(n))

function loadFeatures() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    return []
  }
}

watch(
  viewerRef,
  (viewer) => {
    if (!viewer || tool) return
    tool = new OutlineTool(viewer)
    tool.onPointsChange = (n) => (pointCount.value = n)
    tool.renderSaved(features.value)
  },
  { immediate: true },
)

watch(
  features,
  (list) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    tool?.renderSaved(list)
  },
  { deep: true },
)

/** 用 public/data/buildings.geojson 覆盖浏览器缓存 */
async function reloadFromPlatform(ask = true) {
  if (ask && !window.confirm('用平台数据（public/data/buildings.geojson）覆盖当前描边缓存？')) return
  try {
    const geo = await fetchBuildingGeo()
    features.value = structuredClone(geo.features) // 复制一份，避免改动数据层缓存
    message.value = `已载入平台数据 ${geo.features.length} 栋`
  } catch (err) {
    message.value = `载入失败：${err.message}`
  }
}

function startDraw() {
  draft.value = null
  message.value = ''
  tool.start()
  drawing.value = true
}

function cancelDraw() {
  tool.cancel()
  drawing.value = false
}

function finishDraw() {
  const result = tool.finish()
  if (!result) {
    message.value = '至少需要 3 个点'
    return
  }
  drawing.value = false
  draft.value = {
    ring: result.ring,
    id: '',
    name: '',
    baseHeight: round(result.minHeight - 20),
    topHeight: round(result.maxHeight + 2),
  }
}

function pickHeight(field) {
  message.value = field === 'baseHeight' ? '请点击建筑旁的地面' : '请点击屋顶最高处（屋脊）'
  tool.pickHeight((h) => {
    draft.value[field] = round(field === 'baseHeight' ? h - 1 : h + 1)
    message.value = ''
  })
}

function saveDraft() {
  const d = draft.value
  const id = d.id.trim()
  const name = d.name.trim()
  if (!ID_RE.test(id)) return (message.value = '编号只能用小写字母、数字、下划线或连字符')
  if (features.value.some((f) => f.properties.id === id)) return (message.value = `编号 ${id} 已存在`)
  if (!name) return (message.value = '请填写建筑名称')
  if (d.topHeight <= d.baseHeight) return (message.value = '顶部高度必须大于底部高度')

  features.value.push({
    type: 'Feature',
    properties: {
      id,
      name,
      baseHeight: round(d.baseHeight),
      topHeight: round(d.topHeight),
      heightOffset: SCENE.heightOffset,
      createdAt: new Date().toISOString(),
    },
    geometry: { type: 'Polygon', coordinates: [[...d.ring, d.ring[0]]] },
  })
  draft.value = null
  message.value = `已保存：${name}`
}

function removeFeature(id) {
  if (!window.confirm(`删除建筑 ${id}？`)) return
  features.value = features.value.filter((f) => f.properties.id !== id)
}

function exportGeoJSON() {
  const fc = { type: 'FeatureCollection', name: 'tuocheng_buildings', features: features.value }
  const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'buildings.geojson'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

async function importGeoJSON(event) {
  const file = event.target.files[0]
  event.target.value = ''
  if (!file) return
  try {
    const data = JSON.parse(await file.text())
    const incoming = (data.features ?? []).filter(
      (f) =>
        f.geometry?.type === 'Polygon' &&
        f.properties?.id &&
        Number.isFinite(f.properties.baseHeight) &&
        Number.isFinite(f.properties.topHeight),
    )
    const map = new Map(features.value.map((f) => [f.properties.id, f]))
    incoming.forEach((f) => map.set(f.properties.id, f))
    features.value = [...map.values()]
    message.value = `已导入 ${incoming.length} 栋`
  } catch (err) {
    message.value = `导入失败：${err.message}`
  }
}

function onKeydown(e) {
  if (!drawing.value || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return
  if (e.key === 'Enter') finishDraw()
  else if (e.key === 'Escape') cancelDraw()
  else if (e.ctrlKey && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    tool.undo()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  if (!features.value.length) reloadFromPlatform(false)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  tool?.destroy()
})
</script>

<template>
  <PanelCard class="grow" title="建筑描边" en="Outline">
    <p class="msg" role="status" aria-live="polite">{{ message }}</p>

    <button v-if="!drawing && !draft" type="button" class="btn btn-primary block" @click="startDraw">开始描边</button>

    <section v-if="drawing">
      <p>已点击 <b>{{ pointCount }}</b> 个点</p>
      <div class="row">
        <button type="button" class="btn" :disabled="!pointCount" @click="tool.undo()">撤销</button>
        <button type="button" class="btn btn-primary" :disabled="pointCount < 3" @click="finishDraw">完成</button>
        <button type="button" class="btn" @click="cancelDraw">取消</button>
      </div>
      <p class="hint">俯视建筑，沿屋檐外沿依次点击角点。Enter 完成，Esc 取消，Ctrl+Z 撤销</p>
    </section>

    <form v-if="draft" @submit.prevent="saveDraft">
      <label for="b-id">编号（英文，如 house06）</label>
      <input id="b-id" v-model="draft.id" class="input" type="text" autocomplete="off" required />

      <label for="b-name">名称</label>
      <input id="b-name" v-model="draft.name" class="input" type="text" autocomplete="off" required />

      <label for="b-base">底部高度（m）</label>
      <div class="row">
        <input id="b-base" v-model.number="draft.baseHeight" class="input" type="number" step="0.5" />
        <button type="button" class="btn" @click="pickHeight('baseHeight')">拾取地面</button>
      </div>

      <label for="b-top">顶部高度（m）</label>
      <div class="row">
        <input id="b-top" v-model.number="draft.topHeight" class="input" type="number" step="0.5" />
        <button type="button" class="btn" @click="pickHeight('topHeight')">拾取屋脊</button>
      </div>

      <div class="row actions">
        <button type="submit" class="btn btn-primary">保存</button>
        <button type="button" class="btn" @click="draft = null">放弃</button>
      </div>
    </form>

    <h3>已描建筑（{{ features.length }}）</h3>
    <ul v-if="features.length" class="list">
      <li v-for="f in features" :key="f.properties.id">
        <span>{{ f.properties.name }} <small>{{ f.properties.id }}</small></span>
        <button type="button" class="btn mini" @click="tool.flyTo(f.properties.id)">定位</button>
        <button type="button" class="btn mini" @click="removeFeature(f.properties.id)">删除</button>
      </li>
    </ul>
    <p v-else class="hint">暂无</p>

    <div class="row actions">
      <button type="button" class="btn" :disabled="!features.length" @click="exportGeoJSON">导出</button>
      <label class="btn file-btn">
        导入
        <input class="sr-only" type="file" accept=".geojson,.json" @change="importGeoJSON" />
      </label>
      <button type="button" class="btn" @click="reloadFromPlatform()">载入平台数据</button>
    </div>
    <p class="hint">导出后保存到 gis\buildings.geojson，再运行 06 脚本同步到平台</p>
  </PanelCard>
</template>

<style scoped>
.msg { min-height: 18px; margin: 0 0 6px; color: var(--gold-light); }
.hint { margin: 6px 0 0; font-size: var(--fs-sm); color: var(--text-dim); }
p { margin: 4px 0; }
h3 { margin: 14px 0 6px; font-size: var(--fs-md); font-weight: normal; color: var(--gold-light); }
label { display: block; margin: 8px 0 3px; color: var(--text-dim); }
.block { width: 100%; justify-content: center; }
.row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.row .input { flex: 1; }
.actions { margin-top: 12px; }
.list { list-style: none; margin: 0; padding: 0; }
.list li { display: flex; align-items: center; gap: 4px; padding: 4px 0; border-bottom: 1px solid rgba(201, 164, 92, 0.12); }
.list span { flex: 1; }
small { color: var(--text-dim); }
.mini { padding: 2px 8px; font-size: var(--fs-sm); }
.file-btn { margin: 0; color: var(--gold-light); }
.file-btn:focus-within { outline: 2px solid var(--gold-light); outline-offset: 2px; }
</style>