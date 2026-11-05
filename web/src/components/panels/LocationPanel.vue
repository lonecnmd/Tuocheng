<script setup>
import { computed, onMounted, ref } from 'vue'
import PanelCard from '../layout/PanelCard.vue'

const regions = ref([])
const error = ref('')
const zoom = ref(1)
const offset = ref({ x: 0, y: 0 })
const dragging = ref(false)
const selectedCity = ref(441600)
const cityNames = {
  440100: '广州市', 440200: '韶关市', 440300: '深圳市', 440400: '珠海市',
  440500: '汕头市', 440600: '佛山市', 440700: '江门市', 440800: '湛江市',
  440900: '茂名市', 441200: '肇庆市', 441300: '惠州市', 441400: '梅州市',
  441500: '汕尾市', 441600: '河源市', 441700: '阳江市', 441800: '清远市',
  441900: '东莞市', 442000: '中山市', 445100: '潮州市', 445200: '揭阳市',
  445300: '云浮市',
}
const selectedName = computed(() => cityNames[selectedCity.value] ?? '广东省')
let start = null

// 原始市级边界见 data_shp/guangdong_cities.geojson；这里使用保拓扑简化后的展示副本。
const bounds = { west: 109.65, east: 117.32, south: 20.21, north: 25.53 }
const project = ([lon, lat]) => [18 + (lon - bounds.west) / (bounds.east - bounds.west) * 424, 18 + (bounds.north - lat) / (bounds.north - bounds.south) * 264]
const tuocheng = project([115.188, 24.063])
const paths = computed(() => regions.value.map((feature) => {
  const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
  const d = polygons.flatMap((polygon) => polygon.map((ring) => ring.map((p, i) => {
    const [x, y] = project(p)
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ') + ' Z')).join(' ')
  return { id: feature.properties.code, d }
}))

onMounted(async () => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/guangdong_cities.geojson`)
    if (!response.ok) throw new Error('地图数据读取失败')
    regions.value = (await response.json()).features
  } catch (e) { error.value = e.message }
})

function begin(event) {
  if (event.button !== 0) return
  dragging.value = true
  const box = event.currentTarget.getBoundingClientRect()
  const cityCode = Number(event.target.closest?.('[data-city-code]')?.dataset.cityCode)
  start = { x: event.clientX, y: event.clientY, ox: offset.value.x, oy: offset.value.y, sx: 460 / box.width, sy: 300 / box.height, cityCode, moved: false }
  event.currentTarget.setPointerCapture(event.pointerId)
}
function move(event) {
  if (!dragging.value || !start) return
  if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4) start.moved = true
  offset.value = { x: start.ox + (event.clientX - start.x) * start.sx, y: start.oy + (event.clientY - start.y) * start.sy }
}
function end() {
  if (start?.cityCode && !start.moved) selectedCity.value = start.cityCode
  dragging.value = false
  start = null
}
function changeZoom(delta) { zoom.value = Math.min(3, Math.max(1, +(zoom.value + delta).toFixed(1))) }
function reset() { zoom.value = 1; offset.value = { x: 0, y: 0 }; selectedCity.value = 441600 }
function wheel(event) { changeZoom(event.deltaY < 0 ? .2 : -.2) }
</script>

<template>
  <PanelCard class="location-panel" title="佗城在哪里" en="Location">
    <div class="map-toolbar">
      <span>广东省 · 当前：{{ selectedName }}</span>
      <div class="map-actions">
        <button type="button" aria-label="放大地图" title="放大" @click="changeZoom(.2)">＋</button>
        <button type="button" aria-label="缩小地图" title="缩小" @click="changeZoom(-.2)">－</button>
        <button type="button" title="重置地图位置" @click="reset">复位</button>
      </div>
    </div>
    <div class="map-window" :class="{ dragging }" role="group" aria-label="广东省城市地图，佗城位于河源市龙川县；可点击城市、拖动和缩放" @pointerdown="begin" @pointermove="move" @pointerup="end" @pointercancel="end" @wheel.prevent="wheel">
      <svg viewBox="0 0 460 300" preserveAspectRatio="xMidYMid meet">
        <defs><radialGradient id="mapGlow"><stop stop-color="#f4d78b" stop-opacity=".44" /><stop offset="1" stop-color="#f4d78b" stop-opacity="0" /></radialGradient></defs>
        <g :transform="`translate(${offset.x} ${offset.y}) translate(230 150) scale(${zoom}) translate(-230 -150)`">
          <path v-for="region in paths" :key="region.id" :data-city-code="region.id" :d="region.d" class="city" :class="{ selected: region.id === selectedCity }" fill-rule="evenodd" tabindex="0" role="button" :aria-label="`查看${cityNames[region.id]}`" :aria-pressed="region.id === selectedCity" @keydown.enter.prevent="selectedCity = region.id" @keydown.space.prevent="selectedCity = region.id" />
          <circle :cx="tuocheng[0]" :cy="tuocheng[1]" r="31" fill="url(#mapGlow)" pointer-events="none" />
          <circle :cx="tuocheng[0]" :cy="tuocheng[1]" r="9" class="marker-ring" pointer-events="none" />
          <circle :cx="tuocheng[0]" :cy="tuocheng[1]" r="3.5" class="marker-core" pointer-events="none" />
          <text :x="tuocheng[0] + 12" :y="tuocheng[1] - 9" class="map-label" pointer-events="none">佗城</text>
        </g>
      </svg>
      <span class="city-badge" aria-live="polite">{{ selectedName }}<small v-if="selectedCity === 441600"> · 佗城所在地</small></span>
      <span v-if="error" class="map-error">{{ error }}</span>
    </div>
    <p class="map-note">点击城市查看名称 · 拖动及缩放地图 · 位置示意</p>
  </PanelCard>
</template>

<style scoped>
.map-toolbar { display:flex; align-items:center; justify-content:space-between; gap:6px; color:var(--gold-light); font-size:var(--fs-sm); }
.map-actions { display:flex; gap:4px; flex-shrink:0; }
.map-actions button { min-width:26px; min-height:26px; border:1px solid #c9a45c55; border-radius:4px; background:#c9a45c18; color:var(--gold-light); cursor:pointer; }
.map-actions button:hover { background:#c9a45c44; }
.map-window { position:relative; height:185px; margin-top:5px; overflow:hidden; border-radius:8px; background:radial-gradient(ellipse at 55% 35%,#6c573530,#080f16 78%),url('/img/素材金色2/border.png') center/cover; cursor:grab; touch-action:none; }
.map-window.dragging { cursor:grabbing; }
svg { width:100%; height:100%; }
.city { fill:#ba955329; stroke:#d1ad68; stroke-width:.72; vector-effect:non-scaling-stroke; }
.city:hover, .city:focus-visible { fill:#c777354a; stroke:#f9d990; stroke-width:1.5; cursor:pointer; outline:none; }
.city.selected { fill:#c7773566; stroke:#ffe1a0; stroke-width:2.2; filter:drop-shadow(0 0 5px #f2b854); animation:city-glow 2.8s ease-in-out infinite; }
@keyframes city-glow { 50% { fill:#d28d527a; filter:drop-shadow(0 0 9px #f6cf84); } }
.city-badge { position:absolute; left:10px; bottom:8px; padding:4px 9px; border-left:2px solid var(--gold-light); border-radius:3px; background:#171d20d9; color:#fff0cb; font-size:var(--fs-sm); pointer-events:none; }
.city-badge small { color:var(--text-dim); font-size:var(--fs-xs); }
.marker-ring { fill:#1a1d1a; stroke:#f8dc9e; stroke-width:2; filter:drop-shadow(0 0 7px #f8bd57); }
.marker-core { fill:#fff0c8; }
.map-label { fill:#fff0cb; font-size:14px; font-weight:700; paint-order:stroke; stroke:#151815; stroke-width:3px; }
.map-note { margin:7px 0 0; font-size:var(--fs-xs); color:var(--text-dim); }
.map-error { position:absolute; color:#fff0cb; }
@media (prefers-reduced-motion:reduce) { .city.selected { animation:none; } }
</style>
