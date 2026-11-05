<script setup>
import PanelCard from '../layout/PanelCard.vue'
import { PARTICIPATION_TOPICS } from '../../data/participationSamples'

defineProps({
  items: { type: Array, default: () => [] },
  buildingId: { type: String, default: '' },
  topic: { type: String, default: 'entrance' },
})
const emit = defineEmits(['select-building', 'select-topic'])
const assetUrl = (src) => src?.startsWith('/') ? `${import.meta.env.BASE_URL}${src.slice(1)}` : `${import.meta.env.BASE_URL}${src ?? ''}`
</script>

<template>
  <PanelCard title="参与设计" en="Co-design">
    <template #extra><span class="mock-tag">样板体验</span></template>
    <p class="intro">从建筑和主题进入讨论，查看现状与改造设想，再留下你的意见。</p>
    <div class="project-list">
      <button v-for="building in items" :key="building.id" type="button" class="project"
        :class="{ active: building.id === buildingId }" :aria-pressed="building.id === buildingId"
        @click="emit('select-building', building.id)">
        <img v-if="building.plan?.renderings?.[0]" :src="assetUrl(building.plan.renderings[0].src)" :alt="`${building.name}改造设想`" loading="lazy" />
        <span class="project-copy"><strong>{{ building.name }}</strong><small>{{ building.plan?.title || '方案收集中' }}</small></span>
        <span class="project-arrow" aria-hidden="true">›</span>
      </button>
    </div>
  </PanelCard>

  <PanelCard title="讨论主题" en="Topics">
    <div class="topic-grid" role="group" aria-label="选择讨论主题">
      <button v-for="(item, index) in PARTICIPATION_TOPICS" :key="item.key" type="button"
        :class="{ active: item.key === topic }" :aria-pressed="item.key === topic" @click="emit('select-topic', item.key)">
        <span class="topic-index">{{ String(index + 1).padStart(2, '0') }}</span>
        <strong>{{ item.label }}</strong>
        <small>{{ item.hint }}</small>
      </button>
    </div>
  </PanelCard>

  <PanelCard title="参与步骤" en="How it works">
    <ol class="steps"><li>选择建筑和讨论主题</li><li>查看现状、改造设想</li><li>选择身份，发表意见或表达意向</li></ol>
    <p class="demo-note">所有访客都可参与。本页为样板，提交内容保存在当前浏览器。</p>
  </PanelCard>
</template>

<style scoped>
.intro { margin:0 0 12px; color:var(--text-dim); line-height:1.65; }
.project-list { display:grid; gap:10px; }
.project { position:relative; display:grid; grid-template-columns:82px minmax(0,1fr) 14px; align-items:center; gap:10px; width:100%; padding:7px; border:1px solid #c9a45c30; border-radius:9px; background:#c9a45c0c; color:var(--text); text-align:left; cursor:pointer; }
.project.active,.project:hover { border-color:#ecd08fb0; background:linear-gradient(110deg,#c9a45c28,#c9a45c08); box-shadow:inset 0 0 14px #c9a45c15,0 0 12px #c9a45c22; }
.project img { width:82px; height:64px; border-radius:5px; object-fit:cover; }
.project-copy { display:grid; gap:3px; min-width:0; }
.project-copy strong { font-family:var(--font-title); font-size:var(--fs-lg); color:var(--gold-light); }
.project-copy small { overflow:hidden; color:var(--text-dim); font-size:var(--fs-xs); text-overflow:ellipsis; white-space:nowrap; }
.project-arrow { font-size:24px; color:var(--gold-light); }
.topic-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
.topic-grid button { display:grid; gap:2px; min-height:84px; padding:9px; border:1px solid #c9a45c28; border-radius:8px; background:#c9a45c0a; color:var(--text); text-align:left; cursor:pointer; }
.topic-grid button:hover,.topic-grid button.active { border-color:#ecd08fba; background:#c9a45c23; }
.topic-index { font-family:var(--font-num); font-size:12px; color:var(--gold); }
.topic-grid strong { font-size:var(--fs-md); color:var(--gold-light); }
.topic-grid small { color:var(--text-dim); font-size:var(--fs-xs); line-height:1.3; }
.steps { margin:0; padding-left:25px; line-height:1.8; color:var(--text); }
.steps li::marker { color:var(--gold-light); }
.demo-note { margin:10px 0 0; color:var(--text-dim); font-size:var(--fs-xs); line-height:1.5; }
</style>
