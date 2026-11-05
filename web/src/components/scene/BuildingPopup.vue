<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({ building: { type: Object, required: true } })
const emit = defineEmits(['open', 'close'])

const meta = computed(() => [props.building.category, props.building.era].filter(Boolean).join(' · '))
const supportRate = computed(() => {
  const v = props.building.plan?.votes
  if (!v) return null
  const total = (v.support ?? 0) + (v.neutral ?? 0) + (v.oppose ?? 0)
  return total ? Math.round((v.support / total) * 100) : 0
})

function onKey(e) {
  if (e.key !== 'Escape' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
  emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <section class="popup" aria-labelledby="popup-title">
    <button type="button" class="close" aria-label="关闭" @click="emit('close')">×</button>
    <header>
      <span class="seal" aria-hidden="true">{{ building.name?.slice(0, 1) }}</span>
      <div>
        <h2 id="popup-title">{{ building.name }}</h2>
        <p class="meta">{{ meta || '信息待补充' }} <span v-if="building.mock" class="mock-tag">示意</span></p>
      </div>
    </header>

    <p class="summary">{{ building.summary || '档案资料收集中，欢迎补充。' }}</p>

    <dl class="facts">
      <div v-if="building.area"><dt>占地</dt><dd>{{ building.area }}<small>㎡</small></dd></div>
      <div v-if="building.floors"><dt>层数</dt><dd>{{ building.floors }}<small>层</small></dd></div>
      <div v-if="supportRate !== null"><dt>方案支持率</dt><dd>{{ supportRate }}<small>%</small></dd></div>
    </dl>

    <ul v-if="building.tags?.length" class="tags">
      <li v-for="t in building.tags" :key="t">{{ t }}</li>
    </ul>

    <button type="button" class="btn btn-primary enter" @click="emit('open', building.id)">进入建筑档案 →</button>
  </section>
</template>

<style scoped>
.popup {
  position: absolute;
  right: var(--edge-gap);
  bottom: calc(var(--nav-h) + 20px);
  z-index: 15;
  width: 380px; max-width: calc(100vw - 32px); max-height: calc(100dvh - var(--header-h) - var(--nav-h) - 44px); overflow-y: auto;
  padding: 20px;
  background: linear-gradient(180deg, rgba(30, 26, 20, 0.94), rgba(12, 14, 18, 0.92));
  border: 1px solid var(--panel-border);
  border-top: 2px solid var(--vermilion);
  border-radius: 3px;
  backdrop-filter: blur(8px);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(194, 69, 45, 0.15);
  animation: pop 0.3s ease;
}
/* 右侧面板显示时，移到面板左边 */
.popup.shifted { right: calc(var(--side-w) + var(--edge-gap) + 16px); }
@keyframes pop { from { opacity: 0; transform: translateY(12px); } }

.close {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 36px; height: 36px; padding: 0 4px;
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.close:hover { color: var(--gold-light); }

header { padding-right: 26px; display: flex; align-items: center; gap: 12px; }
.seal {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: var(--vermilion);
  color: #fbe9d0;
  font-family: var(--font-title);
  font-size: 26px;
  border-radius: 4px;
  box-shadow: inset 0 0 0 2px rgba(251, 233, 208, 0.55);
}
h2 { margin: 0; font-family: var(--font-title); font-size: 26px; font-weight: normal; letter-spacing: 3px; color: var(--gold-light); }
.meta { margin: 2px 0 0; font-size: var(--fs-sm); color: var(--text-dim); }

.summary {
  margin: 12px 0;
  line-height: 1.8;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}

.facts { display: flex; gap: 8px; margin: 0 0 10px; }
.facts div {
  flex: 1;
  padding: 6px 8px;
  background: rgba(201, 164, 92, 0.06);
  border: 1px solid rgba(201, 164, 92, 0.14);
}
dt { font-size: var(--fs-xs); color: var(--text-dim); }
dd { margin: 0; font-family: var(--font-num); font-size: 18px; color: var(--gold-light); }
dd small { margin-left: 2px; font-size: var(--fs-xs); color: var(--text-dim); }

.tags { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 12px; padding: 0; }
.tags li { padding: 1px 8px; border: 1px solid rgba(194, 69, 45, 0.6); border-radius: 2px; font-size: var(--fs-xs); color: #f0b8a8; }

.enter { width: 100%; justify-content: center; padding: 8px; letter-spacing: 2px; }
@media (max-width: 1100px) { .popup.shifted { right: var(--edge-gap); } }
</style>