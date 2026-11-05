<script setup>
import { computed, ref, watch } from 'vue'
import PanelCard from '../layout/PanelCard.vue'
import { BUILDING_MODELS } from '../../config/buildingModels'

const props = defineProps({ controller: { type: Object, default: null } })
const selected = ref(BUILDING_MODELS[0].id)
const values = ref({ heading: 0, pitch: 0, roll: 0, scale: 1, east: 0, north: 0, height: 0 })
const saveStatus = ref('')
const names = { house04: '打铁铺', house05: '沙氏祖屋' }
const ready = computed(() => !!props.controller?.get(selected.value))

function sync() {
  values.value = { ...props.controller?.get(selected.value) }
  saveStatus.value = ''
}
watch([() => props.controller, selected], sync, { immediate: true })

function apply(key, raw) {
  const value = Number(raw)
  if (!ready.value || !Number.isFinite(value)) return
  values.value[key] = value
  props.controller.update(selected.value, { [key]: value })
  saveStatus.value = '尚未保存'
}
function reset() { props.controller?.reset(selected.value); sync(); saveStatus.value = '尚未保存' }
function save() { saveStatus.value = props.controller?.save(selected.value) ? '已保存到当前浏览器' : '保存失败，请检查浏览器存储设置' }
</script>

<template>
  <PanelCard title="建筑模型调节" en="MODEL ALIGNMENT">
    <label class="field-label" for="model-choice">选择建筑</label>
    <select id="model-choice" v-model="selected" class="input">
      <option v-for="item in BUILDING_MODELS" :key="item.id" :value="item.id">{{ names[item.id] }}</option>
    </select>
    <p v-if="!ready" class="hint">模型正在加载，请稍候…</p>
    <template v-else>
      <button type="button" class="btn block" @click="controller.focus(selected)">定位查看 {{ names[selected] }}</button>
      <button type="button" class="btn btn-primary block save-button" @click="save">保存当前调整</button>
      <p class="save-status" role="status" aria-live="polite">{{ saveStatus || '调整后点击保存，刷新页面仍会保留' }}</p>
      <div v-for="control in [
        { key: 'heading', label: '水平旋转', min: -180, max: 180, step: 1, unit: '°' },
        { key: 'pitch', label: '前后倾斜', min: -45, max: 45, step: 1, unit: '°' },
        { key: 'roll', label: '左右倾斜', min: -45, max: 45, step: 1, unit: '°' },
        { key: 'scale', label: '大小', min: 0.3, max: 2, step: 0.01, unit: '倍' },
        { key: 'east', label: '左右移动（东+ / 西−）', min: -20, max: 20, step: 0.1, unit: '米' },
        { key: 'north', label: '前后移动（北+ / 南−）', min: -20, max: 20, step: 0.1, unit: '米' },
        { key: 'height', label: '上下移动（上+ / 下−）', min: -15, max: 15, step: 0.1, unit: '米' },
      ]" :key="control.key" class="control">
        <label class="field-label" :for="`model-${control.key}`">{{ control.label }} <strong>{{ values[control.key] }}{{ control.unit }}</strong></label>
        <div class="control-row">
          <input :id="`model-${control.key}`" type="range" :min="control.min" :max="control.max" :step="control.step" :value="values[control.key]" @input="apply(control.key, $event.target.value)" />
          <input type="number" class="input number" :aria-label="`${control.label}数值`" :min="control.min" :max="control.max" :step="control.step" :value="values[control.key]" @change="apply(control.key, $event.target.value)" />
        </div>
      </div>
      <button type="button" class="btn block" @click="reset">恢复该建筑默认位置</button>
      <p class="hint">拖动时实时预览。保存仅作用于当前浏览器；更换 GLB 文件名请到 buildingModels.js 修改。</p>
    </template>
  </PanelCard>
</template>

<style scoped>
.field-label { display: flex; justify-content: space-between; margin: 9px 0 4px; color: var(--text-dim); font-size: var(--fs-sm); }
.field-label strong { color: var(--gold-light); font-weight: 500; }
.block { width: 100%; margin: 10px 0; }
.save-button { margin-bottom: 2px; }
.save-status { min-height: 22px; margin: 0 0 10px; color: var(--gold-light); font-size: var(--fs-sm); }
.control { margin: 12px 0; }
.control-row { display: flex; gap: 10px; align-items: center; }
.control-row input[type='range'] { flex: 1; accent-color: var(--gold); min-width: 0; }
.number { width: 76px; min-width: 76px; }
.hint { margin: 9px 0 0; color: var(--text-dim); font-size: var(--fs-sm); line-height: 1.5; }
</style>
