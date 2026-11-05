<script setup>
import { computed, inject, ref } from 'vue'
import PanelCard from '../layout/PanelCard.vue'
import EChart from '../charts/EChart.vue'

const props = defineProps({ progress: { type: Array, required: true } })
const displayMode = inject('displayMode', ref('standard'))
const option = computed(() => {
  const list = [...props.progress].reverse()
  const large = displayMode.value === 'presentation'
  return {
    grid: { left: large ? 86 : 76, right: 50, top: 12, bottom: 12 },
    xAxis: { type: 'value', max: 100, show: false },
    yAxis: { type: 'category', data: list.map((d) => d.name), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#c0b6a4', fontSize: large ? 17 : 14 } },
    series: [{ type: 'bar', data: list.map((d) => d.value), barWidth: 10, showBackground: true,
      backgroundStyle: { color: 'rgba(201,164,92,0.08)', borderRadius: 4 },
      itemStyle: { borderRadius: 4, color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#8e2f1f' }, { offset: 1, color: '#ecd08f' }] } },
      label: { show: true, position: 'right', color: '#ecd08f', fontSize: large ? 17 : 14, formatter: '{c}%' } }],
  }
})
const label = computed(() => props.progress.map((d) => `${d.name}${d.value}%`).join('，'))
</script>

<template>
  <PanelCard title="资料收集进度" en="Archive">
    <template #extra><span class="mock-tag">示意</span></template>
    <EChart class="chart" :option="option" :aria-label="`资料收集进度：${label}`" />
  </PanelCard>
</template>

<style scoped>.chart { height:200px; min-height:200px; }</style>
