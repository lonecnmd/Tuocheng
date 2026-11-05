<script setup>
import PanelCard from '../layout/PanelCard.vue'
import UiIcon from '../layout/UiIcon.vue'

defineProps({ site: { type: Object, required: true } })
</script>

<template>
  <PanelCard class="grow" title="参与动态" en="Activity">
    <template #extra><span class="mock-tag">示意</span></template>
    <div class="feed-window">
      <div class="feed-track">
      <ul v-for="copy in 2" :key="copy" class="feed" :aria-hidden="copy === 2 ? 'true' : undefined">
      <li v-for="(a, i) in site.activities" :key="i">
        <span class="avatar" aria-hidden="true"><UiIcon :name="a.user.includes('设计') ? 'design' : a.user.includes('沙家') ? 'group' : a.user.includes('文化') ? 'archive' : 'user'" /></span>
        <div class="body">
          <p class="who">
            <strong>{{ a.user }}</strong>
            <span class="from">{{ a.from }}</span>
            <span class="time">{{ a.time }}</span>
          </p>
          <p class="what">{{ a.action }}</p>
        </div>
      </li>
      </ul>
      </div>
    </div>
  </PanelCard>
</template>

<style scoped>
.feed-window { height: min(360px, 36vh); overflow: hidden; mask-image: linear-gradient(transparent,black 8%,black 92%,transparent); }
.feed-track { animation: feed-scroll 54s linear infinite; }
.feed-window:hover .feed-track, .feed-window:focus-within .feed-track { animation-play-state: paused; }
.feed { list-style: none; margin: 0; padding: 0; }
.feed li {
  display: flex;
  gap: 10px;
  padding: 13px 0;
  border-bottom: 1px dashed rgba(201, 164, 92, 0.15);
}
@keyframes feed-scroll { to { transform: translateY(-50%); } }
@media (prefers-reduced-motion: reduce) { .feed-track { animation: none; } .feed-window { overflow-y: auto; } .feed:nth-child(2) { display: none; } }
.avatar {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid var(--gold);
  border-radius: 50%;
  font-family: var(--font-title);
  color: var(--gold-light);
  background: rgba(201, 164, 92, 0.1);
}
.avatar :deep(svg) { width: 22px; height: 22px; }
.body { flex: 1; min-width: 0; }
p { margin: 0; }
.who { display: flex; flex-wrap: wrap; align-items: baseline; gap: 3px 8px; }
.who strong { font-weight: normal; color: var(--gold-light); }
.from { font-size: var(--fs-xs); color: var(--text-dim); }
.time { margin-left: auto; font-size: var(--fs-xs); color: var(--text-dim); white-space: nowrap; }
.what { margin-top: 2px; line-height: 1.6; }
</style>
