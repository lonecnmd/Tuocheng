<script setup>
import { inject, onBeforeUnmount, onMounted } from 'vue'
import * as Cesium from 'cesium'

const props = defineProps({
  items: { type: Array, default: () => [] },
  layer: { type: Object, required: true },
  selectedId: { type: String, default: null },
})
const emit = defineEmits(['select'])

const MAX_DISTANCE = 2500 // 相机距离超过该值（米）时隐藏标签
const viewerRef = inject('viewer')
const els = new Map()
const winPos = new Cesium.Cartesian2()
const toAnchor = new Cesium.Cartesian3()
let removeListener = null

function setEl(id, el) {
  if (el) els.set(id, el)
  else els.delete(id)
}

/** 把屋顶锚点投影到屏幕坐标 */
function update() {
  const { scene, camera } = viewerRef.value
  for (const b of props.items) {
    const el = els.get(b.id)
    const anchor = props.layer.getAnchor(b.id)
    if (!el || !anchor) continue
    Cesium.Cartesian3.subtract(anchor, camera.positionWC, toAnchor)
    const inFront = Cesium.Cartesian3.dot(toAnchor, camera.directionWC) > 0
    const near = Cesium.Cartesian3.magnitude(toAnchor) < MAX_DISTANCE
    const win = inFront && near && Cesium.SceneTransforms.worldToWindowCoordinates(scene, anchor, winPos)
    if (!win) {
      el.style.visibility = 'hidden'
      continue
    }
    el.style.visibility = 'visible'
    el.style.transform = `translate3d(${win.x}px, ${win.y}px, 0)`
  }
}

onMounted(() => {
  removeListener = viewerRef.value.scene.postRender.addEventListener(update)
})
onBeforeUnmount(() => removeListener?.())
</script>

<template>
  <div class="markers">
    <button
      v-for="b in items"
      :key="b.id"
      :ref="(el) => setEl(b.id, el)"
      type="button"
      class="marker"
      :class="{ active: b.id === selectedId }"
      :aria-label="`${b.name}，定位到该建筑`"
      @click="emit('select', b.id)"
    >
      <span class="inner">
        <span class="plate">
          <span class="name">{{ b.name }}</span>
          <span v-if="b.category" class="cat">{{ b.category }}</span>
        </span>
        <span class="stem" aria-hidden="true"></span>
        <span class="dot" aria-hidden="true"></span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.markers { position: absolute; inset: 0; z-index: 5; overflow: hidden; pointer-events: none; }

/* 按钮本身不接收点击，只让可见的标签区域可点，避免遮挡模型 */
.marker {
  position: absolute;
  left: 0;
  top: 0;
  padding: 0;
  border: none;
  background: none;
  visibility: hidden;
  pointer-events: none;
  will-change: transform;
}
.inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -100%);
  pointer-events: auto;
  cursor: pointer;
}
.plate {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
  width: 140px;
  height: 40px;
  align-items: center;
  padding: 0 18px;
  white-space: nowrap;
  background: url('/img/建筑_bg.png') center / 100% 100% no-repeat, rgba(89, 53, 20, .20);
  border: 0;
  border-radius: 0;
  filter: drop-shadow(0 0 9px rgba(226, 175, 83, .46));
  transition: filter .2s, transform .2s;
}
.name { font-family: var(--font-title); font-size: 19px; line-height: 1; letter-spacing: 1px; color: #fff0cc; text-shadow: 0 1px 5px #34200d, 0 0 10px #b26a21; }
.cat { font-size: 12px; line-height: 1; color: #f3dcae; text-shadow: 0 1px 4px #34200d; }
.stem { width: 1px; height: 36px; background: linear-gradient(180deg, var(--gold), rgba(201, 164, 92, 0)); }
.dot {
  width: 10px;
  height: 10px;
  margin-bottom: -5px; /* 圆点中心对准屋顶锚点 */
  border-radius: 50%;
  background: var(--gold-light);
  animation: pulse 2s ease-out infinite;
}
@keyframes pulse {
  from { box-shadow: 0 0 0 0 rgba(236, 208, 143, 0.6); }
  to { box-shadow: 0 0 0 14px rgba(236, 208, 143, 0); }
}

.marker:hover .plate,
.marker.active .plate {
  filter: drop-shadow(0 0 16px rgba(244, 203, 117, .9));
  transform: translateY(-3px);
}
.marker:focus-visible { outline: none; }
.marker:focus-visible .plate { outline: 2px solid var(--gold-light); outline-offset: 2px; }
</style>
