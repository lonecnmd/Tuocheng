<script setup>
defineProps({
  title: { type: String, required: true },
  en: { type: String, default: '' },
})
</script>

<template>
  <section class="panel-card">
    <header class="panel-head">
      <span class="diamond" aria-hidden="true"></span>
      <h2>{{ title }}</h2>
      <small v-if="en">{{ en }}</small>
      <div class="extra"><slot name="extra" /></div>
    </header>
    <div class="panel-body"><slot /></div>
  </section>
</template>

<style scoped>
.panel-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 16px 18px;
  background: linear-gradient(180deg, rgba(30, 28, 23, 0.94), rgba(14, 19, 22, 0.94));
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  backdrop-filter: blur(6px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), inset 0 0 24px rgba(201, 164, 92, 0.06);
}
/* 对角描金 */
.panel-card::before,
.panel-card::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid var(--gold);
  pointer-events: none;
}
.panel-card::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.panel-card::after { right: -1px; bottom: -1px; border-left: none; border-top: none; }

.panel-head {
  position: relative;
  display: flex;
  align-items: center; flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(201, 164, 92, 0.18);
  min-height: 36px;
}
/* 标题下方扫光 */
.panel-head::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 40%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-light), transparent);
  animation: scan 5s linear infinite;
}
@keyframes scan {
  from { transform: translateX(-100%); }
  to { transform: translateX(260%); }
}

.diamond {
  align-self: center;
  flex-shrink: 0; width: 8px;
  height: 8px;
  background: var(--vermilion);
  transform: rotate(45deg);
  box-shadow: 0 0 8px rgba(194, 69, 45, 0.7);
}
h2 {
  margin: 0;
  font-family: var(--font-title);
  font-size: var(--fs-xl);
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--gold-light);
  text-shadow: 0 0 12px rgba(236, 208, 143, 0.25);
}
small {
  font-size: var(--fs-xs);
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-dim);
  opacity: 0.9;
}
.extra { margin-left: auto; font-size: var(--fs-sm); color: var(--text-dim); }
.panel-body { flex: 1; min-height: 0; overflow-y: auto; overflow-wrap: anywhere; }
.panel-head small { font-size: 11px; letter-spacing: .8px; }
@media (max-width: 1440px) { .panel-head small { display: none; } }
</style>