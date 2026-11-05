<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { createViewer } from '../cesium/initViewer'
import { loadTileset } from '../cesium/tileset'
import { SCENE } from '../config/scene'

const emit = defineEmits(['ready', 'error'])
const container = ref(null)
let viewer = null

onMounted(async () => {
  viewer = createViewer(container.value, { terrain: SCENE.terrain })
  try {
    const tileset = await loadTileset(viewer, SCENE.tilesetUrl, {
      heightOffset: SCENE.heightOffset,
      maximumScreenSpaceError: SCENE.maximumScreenSpaceError,
    })
    emit('ready', { viewer, tileset })
  } catch (err) {
    console.error(err)
    emit('error', err)
  }
})

onUnmounted(() => viewer?.destroy())
</script>

<template>
  <div ref="container" class="cesium-container"></div>
</template>

<style scoped>
.cesium-container { position: absolute; inset: 0; }
</style>