<script setup>
import { ref } from 'vue'
import SceneView from './views/SceneView.vue'
import DemoLogin from './views/DemoLogin.vue'
import router from './router'
const signedIn = ref(sessionStorage.getItem('tuocheng.demo.signedIn') === '1')
function login() { sessionStorage.setItem('tuocheng.demo.signedIn', '1'); signedIn.value = true }
function logout() { sessionStorage.removeItem('tuocheng.demo.signedIn'); signedIn.value = false; router.replace('/') }
</script>
<template>
  <SceneView v-if="signedIn" @logout="logout" />
  <DemoLogin v-else @login="login" />
</template>
