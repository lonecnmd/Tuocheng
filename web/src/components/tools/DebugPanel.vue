<script setup>
import { inject, onBeforeUnmount, ref, watch } from 'vue'
import * as Cesium from 'cesium'
import PanelCard from '../layout/PanelCard.vue'
import { setHeightOffset } from '../../cesium/tileset'
import { SCENE } from '../../config/scene'

const viewerRef = inject('viewer')
const tilesetRef = inject('tileset')

const picked = ref(null)
const copied = ref(false)
const heightOffset = ref(SCENE.heightOffset)
const sse = ref(tilesetRef.value?.maximumScreenSpaceError ?? SCENE.maximumScreenSpaceError)
const hiRes = ref(false)
const showFps = ref(false)
let handler = null

watch(
  viewerRef,
  (viewer) => {
    if (!viewer || handler) return
    hiRes.value = !viewer.useBrowserRecommendedResolution
    showFps.value = viewer.scene.debugShowFramesPerSecond
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((e) => onClick(viewer, e.position), Cesium.ScreenSpaceEventType.LEFT_CLICK)
  },
  { immediate: true },
)

function onClick(viewer, screenPos) {
  const position = viewer.scene.pickPosition(screenPos)
  if (!Cesium.defined(position)) return
  const c = Cesium.Cartographic.fromCartesian(position)
  picked.value = {
    lon: Cesium.Math.toDegrees(c.longitude).toFixed(7),
    lat: Cesium.Math.toDegrees(c.latitude).toFixed(7),
    height: c.height.toFixed(2),
    terrain: viewer.scene.globe.getHeight(c)?.toFixed(2) ?? '-',
  }
  copied.value = false
}

async function copyPicked() {
  const { lon, lat, height } = picked.value
  try {
    await navigator.clipboard.writeText(`${lon}, ${lat}, ${height}`)
    copied.value = true
  } catch {
    copied.value = false
  }
}

function flyToModel() {
  const tileset = tilesetRef.value
  if (!tileset) return
  viewerRef.value.flyTo(tileset, {
    duration: 1.5,
    offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), tileset.boundingSphere.radius * 1.5),
  })
}

const applyOffset = () => tilesetRef.value && setHeightOffset(tilesetRef.value, Number(heightOffset.value) || 0)
const applySse = () => tilesetRef.value && (tilesetRef.value.maximumScreenSpaceError = Number(sse.value))
const applyHiRes = () => (viewerRef.value.useBrowserRecommendedResolution = !hiRes.value)
const applyFps = () => (viewerRef.value.scene.debugShowFramesPerSecond = showFps.value)

onBeforeUnmount(() => handler?.destroy())
</script>

<template>
  <PanelCard title="场景调试" en="Debug">
    <button type="button" class="btn block" @click="flyToModel">飞到完整模型</button>

    <h3>点击拾取</h3>
    <template v-if="picked">
      <dl class="coords">
        <dt>经度</dt><dd>{{ picked.lon }}</dd>
        <dt>纬度</dt><dd>{{ picked.lat }}</dd>
        <dt>模型</dt><dd>{{ picked.height }} m</dd>
        <dt>地形</dt><dd>{{ picked.terrain }} m</dd>
      </dl>
      <button type="button" class="btn small" @click="copyPicked">{{ copied ? '已复制' : '复制坐标' }}</button>
    </template>
    <p v-else class="hint">点击模型任意位置</p>

    <h3>高度偏移</h3>
    <label for="dbg-offset" class="hint">偏移量（米），确定后写回 scene.js</label>
    <div class="row">
      <input id="dbg-offset" v-model="heightOffset" class="input" type="number" step="0.5" @keyup.enter="applyOffset" />
      <button type="button" class="btn" @click="applyOffset">应用</button>
    </div>

    <h3>显示</h3>
    <label for="dbg-sse" class="hint">屏幕误差（越小越精细）</label>
    <select id="dbg-sse" v-model="sse" class="input" @change="applySse">
      <option :value="4">4（精细）</option>
      <option :value="8">8</option>
      <option :value="16">16（默认）</option>
      <option :value="32">32（流畅）</option>
    </select>
    <label class="check"><input v-model="hiRes" type="checkbox" @change="applyHiRes" /> 高清渲染（高分屏）</label>
    <label class="check"><input v-model="showFps" type="checkbox" @change="applyFps" /> 显示帧率</label>
  </PanelCard>
</template>

<style scoped>
h3 { margin: 12px 0 6px; font-size: var(--fs-md); font-weight: normal; color: var(--gold-light); }
.hint { display: block; margin: 0 0 4px; font-size: var(--fs-sm); color: var(--text-dim); }
.block { width: 100%; justify-content: center; }
.small { margin-top: 6px; padding: 2px 10px; font-size: var(--fs-sm); }
.coords { display: grid; grid-template-columns: 36px 1fr; gap: 2px 8px; margin: 0; }
.coords dt { color: var(--text-dim); }
.coords dd { margin: 0; font-family: Consolas, monospace; }
.row { display: flex; gap: 6px; }
.row .input { flex: 1; }
.check { display: flex; align-items: center; gap: 6px; margin-top: 8px; cursor: pointer; }
</style>