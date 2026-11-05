<script setup>
import PanelCard from '../layout/PanelCard.vue'
import UiIcon from '../layout/UiIcon.vue'

defineProps({
  items: { type: Array, default: () => [] },
  selectedId: { type: String, default: null },
  title: { type: String, default: '重点建筑' },
  en: { type: String, default: 'Featured' },
})
defineEmits(['locate', 'open'])
</script>

<template>
  <PanelCard :title="title" :en="en">
    <template #extra>{{ items.length }} 栋</template>
    <ul v-if="items.length" class="list">
      <li v-for="(b, i) in items" :key="b.id" :class="{ active: b.id === selectedId }">
        <span class="index" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
        <div class="info">
          <strong>{{ b.name }}</strong>
          <span class="meta">
            {{ b.category || '未分类' }}<template v-if="b.area"> · {{ b.area }} ㎡</template>
          </span>
        </div>
        <div class="ops">
          <button type="button" class="btn icon-action" :aria-label="`定位到${b.name}`" :title="`定位到${b.name}`" @click="$emit('locate', b.id)"><UiIcon name="locate" /></button>
          <button type="button" class="btn btn-primary icon-action" :aria-label="`打开${b.name}档案`" :title="`打开${b.name}档案`" @click="$emit('open', b.id)"><UiIcon name="archive" /></button>
        </div>
      </li>
    </ul>
    <p v-else class="empty">暂无建筑数据</p>
  </PanelCard>
</template>

<style scoped>
.list { list-style: none; margin: 0; padding: 0; }
.list li {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 14px 6px;
  border-left: 2px solid transparent;
  border-bottom: 1px solid rgba(201, 164, 92, 0.12);
  transition: background 0.2s;
}
.list li:hover { background: rgba(201, 164, 92, 0.06); }
.list li.active { background: linear-gradient(90deg, rgba(194, 69, 45, 0.25), transparent); border-left-color: var(--gold); }
.index { font-family: var(--font-num); font-size: 22px; color: var(--gold); opacity: 0.7; }
.info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.info strong { font-family: var(--font-title); font-size: var(--fs-lg); font-weight: normal; letter-spacing: 1px; }
.meta { font-size: var(--fs-xs); color: var(--text-dim); }
.ops { grid-column: 3; grid-row: 1; display: flex; gap: 5px; }
.ops .btn { padding: 5px 14px; font-size: var(--fs-sm); }
.ops .icon-action { width: 38px; height: 38px; min-height: 38px; padding: 7px; }
.ops .icon-action :deep(svg) { width: 23px; height: 23px; }
.empty { color: var(--text-dim); }
</style>
