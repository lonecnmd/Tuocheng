<script setup>
defineProps({ name: { type: String, required: true } })

const paths = {
  design: 'M14 5l5 5M4 20l5-1L20 8a2.1 2.1 0 0 0-5-5L4 14zM13 20h7',
  chat: 'M20 11a8 8 0 0 1-8 8H8l-5 3 1-6a8 8 0 1 1 16-5zM8 10h8M8 14h5',
  tools: 'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',
  home: 'M4 10l8-7 8 7M6 9v11h12V9M10 20v-7h4v7',
  panels: 'M3 4h18v16H3zM8 4v16M16 4v16',
  locate: 'M12 3a8 8 0 0 0-8 8c0 5 8 10 8 10s8-5 8-10a8 8 0 0 0-8-8zM12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  archive: 'M4 5h16v4H4zM5 9v11h14V9M10 13h4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3-7 8-7s8 3 8 7',
  group: 'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-7 7-7s7 3 7 7M16 5a3 3 0 0 1 0 6M17 14c3 0 5 3 5 7',
  logout: 'M10 4H4v16h6M15 7l5 5-5 5M20 12H9',
}
</script>

<template>
  <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path :d="paths[name]" />
  </svg>
</template>

<style scoped>
.ui-icon { display: block; width: 1.25em; height: 1.25em; flex: 0 0 auto; }
</style>
