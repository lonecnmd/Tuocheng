<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  location: { type: String, default: '' },
})

const titleParts = computed(() => props.title.split(' · '))
const now = ref(new Date())
const timer = setInterval(() => (now.value = new Date()), 1000)
onBeforeUnmount(() => clearInterval(timer))

const pad = (n) => String(n).padStart(2, '0')
const time = computed(() => {
  const d = now.value
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})
const date = computed(() => {
  const d = now.value
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} 星期${'日一二三四五六'[d.getDay()]}`
})
</script>

<template>
  <header class="app-header">
    <div class="left">
      <span class="location"><span class="pin" aria-hidden="true"></span>{{ location }}</span>
      <div class="actions"><slot name="left" /></div>
    </div>

    <div class="center">
      <span class="seal" aria-hidden="true">佗</span>
      <div>
        <div class="title-line"><h1>{{ titleParts[0] }}</h1><span v-if="titleParts[1]" class="platform-name">{{ titleParts.slice(1).join(" · ") }}</span></div>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      </div>
    </div>

    <div class="right">
      <span class="clock">{{ time }}</span>
      <span class="date">{{ date }}</span>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  height: var(--header-h);
  display: grid;
  grid-template-columns: minmax(280px, 1fr) auto minmax(180px, 1fr); gap: 16px;
  align-items: center;
  padding: 0 var(--edge-gap) 8px;
  background: linear-gradient(180deg, rgba(11, 13, 16, 0.96) 0%, rgba(11, 13, 16, 0.92) 65%, transparent 100%);
  pointer-events: none;
}
.app-header::after {
  content: '';
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 8px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(201, 164, 92, 0.5) 30%, var(--gold-light) 50%, rgba(201, 164, 92, 0.5) 70%, transparent);
}
.app-header > * { pointer-events: auto; }

.left { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.location { display: flex; align-items: center; gap: 8px; color: var(--gold-light); letter-spacing: 2px; }
.pin { width: 8px; height: 8px; background: var(--vermilion); transform: rotate(45deg); box-shadow: 0 0 8px rgba(194, 69, 45, 0.8); }
.actions { display: flex; gap: 8px; }

.center { display: flex; align-items: center; gap: 14px; }
.seal {
  flex-shrink: 0; width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  background: var(--vermilion);
  color: #fbe9d0;
  font-family: var(--font-title);
  font-size: 36px;
  border-radius: 4px;
  box-shadow: inset 0 0 0 2px rgba(251, 233, 208, 0.55), 0 0 18px rgba(194, 69, 45, 0.45);
}
h1 {
  margin: 0;
  font-family: var(--font-title);
  font-size: clamp(30px, 2.2vw, 42px);
  font-weight: normal;
  letter-spacing: 6px;
  background: linear-gradient(180deg, #fff3d6 0%, var(--gold-light) 45%, var(--gold) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 2px 8px rgba(201, 164, 92, 0.35));
}
.subtitle { margin: 2px 0 0; font-size: 11px; letter-spacing: 3px; color: var(--text-dim); text-align: center; }

.right { justify-self: end; display: flex; flex-direction: column; align-items: flex-end; }
.clock { font-family: var(--font-num); font-size: 30px; letter-spacing: 2px; color: var(--gold-light); font-variant-numeric: tabular-nums; }
.date { font-size: var(--fs-sm); letter-spacing: 1px; color: var(--text-dim); }

.title-line { display: flex; align-items: baseline; gap: 14px; }
.platform-name { color: var(--gold-light); font-size: var(--fs-sm); letter-spacing: 2px; }
.location { font-size: var(--fs-sm); }
.actions { flex-wrap: wrap; }
@media (max-width: 1350px) {
  .platform-name { display: block; font-size: var(--fs-sm); }
  .title-line { display: block; text-align: center; }
  .subtitle { display: none; }
  h1 { letter-spacing: 4px; }
}
@media (max-width: 1000px) {
  .app-header { grid-template-columns: 1fr auto; }
  .center { grid-column: 2; grid-row: 1; }
  .right { display: none; }
}
@media (max-width: 760px) {
  .app-header { grid-template-columns: 1fr; align-content: center; gap: 8px; }
  .center { grid-column: 1; justify-content: center; gap: 10px; }
  .left { grid-row: 2; align-items: center; }
  .location, .platform-name { display: none; }
  .seal { width: 40px; height: 40px; font-size: 28px; }
  h1 { font-size: 30px; }
  .actions { justify-content: center; gap: 6px; }
}
</style>