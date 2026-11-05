<script setup>
import { ref } from 'vue'
import PanelCard from '../layout/PanelCard.vue'

const props = defineProps({ site: { type: Object, required: true } })
const expanded = ref(false)
</script>

<template>
  <PanelCard title="街区概况" en="Overview">
    <p class="intro" :class="{ expanded }">{{ site.intro }}</p>
    <button type="button" class="more" :aria-expanded="expanded" @click="expanded = !expanded">
      {{ expanded ? '收起' : '展开全文' }}
    </button>
    <ul class="stats">
      <li v-for="s in site.stats" :key="s.label">
        <span class="value">{{ s.value }}<small>{{ s.unit }}</small></span>
        <span class="label">{{ s.label }} <em v-if="s.mock" class="mock-tag">示意</em></span>
      </li>
    </ul>
  </PanelCard>

  <PanelCard title="历史脉络" en="Timeline">
    <ol class="timeline">
      <li v-for="t in site.timeline" :key="t.year">
        <span class="year">{{ t.year }}</span>
        <span>{{ t.text }}</span>
        <em v-if="t.mock" class="mock-tag">示意</em>
      </li>
    </ol>
  </PanelCard>

</template>

<style scoped>
.intro {
  margin: 0;
  line-height: 1.8;
  text-indent: 2em;
  text-align: justify;
  color: var(--text-dim);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  overflow: hidden;
}
.intro.expanded { display: block; }
.more { min-height: 32px; padding: 0; background: none; border: none; color: var(--gold); font-size: var(--fs-sm); cursor: pointer; }

.stats {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.stats li {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 4px;
  background: rgba(201, 164, 92, 0.06);
  border: 1px solid rgba(201, 164, 92, 0.14);
  border-radius: 6px;
}
.value { font-family: var(--font-num); font-size: clamp(22px, 1.5vw, 28px); line-height: 1.4; color: var(--gold-light); }
.value small { margin-left: 2px; font-size: var(--fs-xs); color: var(--text-dim); }
.label { margin-top: 3px; font-size: var(--fs-xs); color: var(--text-dim); text-align: center; }

.timeline { list-style: none; margin: 0; padding: 0 0 0 12px; border-left: 1px solid rgba(201, 164, 92, 0.3); }
.timeline li { position: relative; padding: 0 0 12px 10px; line-height: 1.6; }
.timeline li::before {
  content: '';
  position: absolute;
  left: -17px;
  top: 6px;
  width: 9px;
  height: 9px;
  background: var(--ink-900);
  border: 2px solid var(--vermilion);
  transform: rotate(45deg);
}
.year { display: block; font-family: var(--font-title); font-size: var(--fs-md); color: var(--gold-light); }

.label { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 3px; }
.timeline li:last-child { padding-bottom: 0; }
</style>
