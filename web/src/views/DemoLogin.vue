<script setup>
import { ref } from 'vue'
import UiIcon from '../components/layout/UiIcon.vue'
const emit = defineEmits(['login'])
const account = ref('')
const password = ref('')
const error = ref('')
const background = `${import.meta.env.BASE_URL}reference/login-bg.jpg`
function submit() {
  if (account.value === '111' && password.value === '123') { error.value = ''; emit('login') }
  else error.value = '账号或密码不正确，请使用演示账号 111 / 123。'
}
</script>
<template>
  <main class="login" :style="{ '--login-image': `url('${background}')` }">
    <div class="login-content">
      <div class="brand">
        <span class="brand-seal" aria-hidden="true">佗</span>
        <div><p class="eyebrow">TUOCHENG · DIGITAL HERITAGE</p><h1>佗城数字街区</h1><p class="brand-sub">实景三维 · 建筑档案 · 参与设计</p></div>
      </div>
      <form class="login-form" @submit.prevent="submit">
        <p class="section-kicker">平台入口 / PLATFORM ACCESS</p>
        <h2>走进佗城，读懂街区</h2>
        <p class="lead">在三维实景中查看建筑与街区记忆。</p>
        <label for="demo-account">演示账号</label>
        <div class="field"><UiIcon name="user" /><input id="demo-account" v-model.trim="account" type="text" autocomplete="username" placeholder="请输入账号" required /></div>
        <label for="demo-password">密码</label>
        <div class="field"><UiIcon name="archive" /><input id="demo-password" v-model="password" type="password" autocomplete="current-password" placeholder="请输入密码" required /></div>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button type="submit" class="submit">进入数字街区 <span aria-hidden="true">↗</span></button>
        <p class="demo-note">演示入口：账号 <strong>111</strong> · 密码 <strong>123</strong><br />仅用于界面展示，不提供真实账号安全保护。</p>
      </form>
    </div>
    <p class="login-footer">广东 · 河源 · 龙川 <span>佗城数字街区参与式设计平台</span></p>
  </main>
</template>
<style scoped>
.login { position: relative; isolation: isolate; width: 100%; min-height: 100dvh; overflow: auto; background: #0c1011; }
.login::before { content: ''; position: absolute; inset: 0; z-index: -2; background: var(--login-image) center / cover no-repeat; filter: sepia(1) saturate(.45) hue-rotate(340deg) brightness(.42); }
.login::after { content: ''; position: absolute; inset: 0; z-index: -1; background: radial-gradient(ellipse at 25% 35%, #ae7d3733, transparent 45%), linear-gradient(90deg,#0b1111d9,#10151888 55%,#0a0d10d9); }
.login-content { display: grid; grid-template-columns: minmax(300px, 1fr) minmax(360px, 440px); align-items: center; gap: clamp(50px, 10vw, 220px); width: min(1360px, calc(100% - 80px)); min-height: calc(100dvh - 70px); margin: auto; }
.brand { display: flex; align-items: flex-start; gap: 24px; text-shadow: 0 3px 30px #000; }
.brand-seal { width: 76px; height: 76px; flex: 0 0 auto; display: grid; place-items: center; background: linear-gradient(135deg,#c2452d,#7b2b1d); color: #fff0d0; font: 50px var(--font-title); box-shadow: 0 12px 50px #0007; }
.eyebrow,.section-kicker { margin: 0 0 8px; color: var(--gold); font-size: 13px; letter-spacing: 3px; }
h1 { margin: 0; color: #f8e7bb; font: normal clamp(42px, 4vw, 70px)/1.25 var(--font-title); letter-spacing: .12em; white-space: nowrap; }
.brand-sub { margin: 18px 0 0; color: #e8dac1; letter-spacing: 5px; }
.login-form { padding: 42px 42px 30px; background: linear-gradient(120deg,#18201edb,#151615cb 75%,#10131599); backdrop-filter: blur(18px); box-shadow: 0 24px 70px #0005, -15px 0 45px #c9a45c12; }
h2 { margin: 0; color: #f2e3bd; font: normal 34px var(--font-title); letter-spacing: 2px; }
.lead { margin: 8px 0 36px; color: var(--text-dim); }
label { display: block; margin: 20px 0 7px; color: #ead9b5; font-size: 15px; }
.field { display: flex; align-items: center; gap: 12px; padding: 0 14px; height: 50px; background: #080d0da8; box-shadow: inset 0 -1px #c9a45c77; color: var(--gold); }
.field:focus-within { box-shadow: inset 0 -2px var(--gold-light), 0 0 18px #c9a45c20; }
.field :deep(svg) { width: 22px; height: 22px; }
input { width: 100%; height: 100%; border: 0; outline: none; background: transparent; color: #fff5de; font-size: 17px; }
input::placeholder { color: #a69c8c; }
.error { color: #ffc6b7; font-size: 14px; }
.submit { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 34px; padding: 13px 20px; border: 0; background: linear-gradient(100deg,#a43f2b,#c99a52); color: #fff8e9; font-size: 18px; letter-spacing: 3px; cursor: pointer; transition: filter .2s, transform .2s; }
.submit:hover { filter: brightness(1.15); transform: translateY(-2px); }
.demo-note { margin: 24px 0 0; color: #c6bba9; font-size: 13px; line-height: 1.8; }
.demo-note strong { color: #ead393; }
.login-footer { position: absolute; left: 40px; right: 40px; bottom: 14px; display: flex; justify-content: space-between; margin: 0; color: #c9bb9f; font-size: 12px; letter-spacing: 2px; }
@media (max-width: 900px) { .login-content { display: flex; flex-direction: column; justify-content: center; gap: 32px; width: min(500px, calc(100% - 36px)); padding: 40px 0 70px; } .brand { align-self: flex-start; } .login-form { width: 100%; padding: 30px; } h1 { font-size: clamp(32px, 7vw, 48px); } .brand-seal { width: 58px; height: 58px; font-size: 40px; } .brand-sub { letter-spacing: 1px; } .login-footer { left: 18px; right: 18px; } .login-footer span { display: none; } }
</style>
