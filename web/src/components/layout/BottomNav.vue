<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import UiIcon from './UiIcon.vue'
import { NAV_ITEMS } from '../../config/navigation'

const mode = defineModel({ type: String, required: true })
const imageBase = import.meta.env.BASE_URL
const failedImages = ref(new Set())
const startIndex = ref(0)
const position = ref(0)
const moving = ref(false)
const step = 116
const items = computed(() => Array.from({ length: NAV_ITEMS.length + 1 }, (_, i) => NAV_ITEMS[(startIndex.value + i) % NAV_ITEMS.length]))
let timer
function advance() {
  if (moving.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    startIndex.value = (startIndex.value + 1) % NAV_ITEMS.length
    return
  }
  moving.value = true
  requestAnimationFrame(() => { position.value = -step })
}
function finish(event) {
  if (event.target !== event.currentTarget || event.propertyName !== 'transform' || !moving.value) return
  moving.value = false
  startIndex.value = (startIndex.value + 1) % NAV_ITEMS.length
  position.value = 0
}
function pause() { if (timer) clearInterval(timer); timer = undefined }
function play() {
  pause()
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(advance, 3100)
}
function select(item) { mode.value = item.key }
onMounted(() => {
  play()
})
onBeforeUnmount(pause)
</script>

<template>
  <nav class="bottom-nav" aria-label="功能导航" @mouseenter="pause" @mouseleave="play" @focusin="pause" @focusout="play">
    <div class="nav-viewport">
      <div class="nav-track" :class="{ moving }" :style="{ transform: `translateX(${position}px)` }" @transitionend="finish">
        <button v-for="(item, i) in items" :key="`${startIndex}-${i}`" type="button" class="nav-btn"
          :tabindex="i === NAV_ITEMS.length ? -1 : 0" :aria-hidden="i === NAV_ITEMS.length ? 'true' : undefined"
          :class="{ active: mode === item.key }" :aria-pressed="mode === item.key" @click="select(item)">
          <span class="icon-wrap" aria-hidden="true">
            <span v-if="item.image && !failedImages.has(item.image)" class="asset-icon"
              :class="{ monochrome: item.imageMode === 'mask' }" :style="{ '--icon-image': `url('${imageBase}${item.image}')` }">
              <img :src="imageBase + item.image" alt="" @error="failedImages.add(item.image)" />
            </span>
            <UiIcon v-else :name="item.icon" />
          </span>
          <span class="label">{{ item.label }}</span>
        </button>
      </div>
    </div>
    <button type="button" class="nav-arrow" aria-label="向左循环浏览导航" @click="advance">‹</button>
  </nav>
</template>

<style scoped>
.bottom-nav { position:absolute; left:50%; bottom:12px; z-index:20; transform:translateX(-50%); display:flex; align-items:center; gap:6px; width:min(700px, 58vw); max-width:calc(100% - 20px); padding:6px 4px; border:0; background:none; box-shadow:none; backdrop-filter:none; }
.nav-viewport { flex:1; min-width:0; overflow:hidden; mask-image:linear-gradient(90deg,transparent 0%,#000 16%,#000 84%,transparent 100%); }
.nav-track { display:flex; gap:10px; width:max-content; }
.nav-track.moving { transition:transform .75s cubic-bezier(.22,.65,.24,1); }
.nav-btn { position:relative; display:flex; flex-direction:column; align-items:center; gap:3px; flex:0 0 106px; width:106px; padding:2px 0; border:0; background:none; color:var(--text); cursor:pointer; }
.nav-btn:hover { color:var(--gold-light); }
.icon-wrap { position:relative; display:grid; place-items:center; width:58px; height:58px; color:var(--gold-light); transition:transform .25s; }
.icon-wrap::before { content:''; position:absolute; inset:0; z-index:-1; border:1px solid #eac47a; border-radius:50%; background:radial-gradient(circle,#d9ad552a 0 33%,#d9ad5530 46%,#1b283362 70%,transparent 73%),url('/img/素材金色2/cricle.png') center/contain no-repeat; box-shadow:0 0 9px #d9ad5588,inset 0 0 10px #e9be7266; }
.nav-btn.active .icon-wrap, .nav-btn:hover .icon-wrap { transform:translateY(-4px) scale(1.08); filter:drop-shadow(0 0 8px #e6b55f); }
.nav-btn.active .icon-wrap::before { box-shadow:0 0 18px #edc479,inset 0 0 14px #e9be7288; }
.icon-wrap .ui-icon { width:30px; height:30px; }
.asset-icon { display:block; width:33px; height:33px; }
.asset-icon img { display:block; width:100%; height:100%; object-fit:contain; }
.asset-icon.monochrome { background:currentColor; mask:var(--icon-image) center/contain no-repeat; }
.asset-icon.monochrome img { opacity:0; }
.label { font-size:var(--fs-md); font-weight:600; white-space:nowrap; text-shadow:0 2px 7px #171813,0 0 15px #171813; }
.nav-btn.active { color:#fff0d1; }
.nav-arrow { z-index:1; flex:0 0 24px; height:52px; border:0; background:none; color:var(--gold-light); font-size:34px; line-height:1; cursor:pointer; text-shadow:0 0 10px #c9a45c; }
@media(max-width:1100px) { .bottom-nav { width:min(620px, 54vw); } }
@media(max-width:760px) { .bottom-nav { width:calc(100% - 16px); bottom:6px; padding:3px 5px; } .icon-wrap { width:48px; height:48px; } .asset-icon { width:28px; height:28px; } .nav-arrow { flex-basis:18px; } }
@media(prefers-reduced-motion:reduce) { .nav-track.moving,.icon-wrap { transition:none; } }
</style>
