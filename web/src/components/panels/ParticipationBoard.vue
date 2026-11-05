<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import PanelCard from '../layout/PanelCard.vue'
import { PARTICIPATION_ROLES, PARTICIPATION_TOPICS, SAMPLE_OPINIONS } from '../../data/participationSamples'

const props = defineProps({ building: { type: Object, default: null }, topic: { type: String, default: 'entrance' } })
const emit = defineEmits(['select-topic'])
const tab = ref('plan')
const imageIndex = ref(0)
const lightbox = ref(null)
const form = ref({ role: '居民', name: '', from: '', text: '' })
const message = ref('')
const comments = ref([])
const myVote = ref(null)
const TOPIC_LABELS = Object.fromEntries(PARTICIPATION_TOPICS.map((item) => [item.key, item.label]))
const VOTE_LABELS = { support: '支持', neutral: '有疑问', oppose: '建议修改' }
const assetUrl = (src) => src?.startsWith('/') ? `${import.meta.env.BASE_URL}${src.slice(1)}` : `${import.meta.env.BASE_URL}${src ?? ''}`
const commentKey = (id) => `tuocheng.comments.${id}`
const voteKey = (id) => `tuocheng.vote.${id}`
function readComments(id) {
  try { const list = JSON.parse(localStorage.getItem(commentKey(id)) || '[]'); return Array.isArray(list) ? list : [] }
  catch { return [] }
}
watch(() => props.building?.id, (id) => {
  tab.value = 'plan'
  imageIndex.value = 0
  lightbox.value = null
  comments.value = id ? readComments(id) : []
  try { myVote.value = id ? localStorage.getItem(voteKey(id)) : null } catch { myVote.value = null }
  message.value = ''
}, { immediate: true })
watch(() => props.topic, () => { tab.value = 'discuss' })

const topicName = computed(() => TOPIC_LABELS[props.topic] ?? '入口')
const photos = computed(() => props.building?.photos ?? [])
const renderings = computed(() => props.building?.plan?.renderings ?? [])
const imageCount = computed(() => Math.max(1, Math.min(photos.value.length, renderings.value.length)))
const currentPhoto = computed(() => photos.value[imageIndex.value % photos.value.length] ?? null)
const currentRendering = computed(() => renderings.value[imageIndex.value % renderings.value.length] ?? null)
const votes = computed(() => {
  const counts = { support: 0, neutral: 0, oppose: 0, ...(props.building?.plan?.votes ?? {}) }
  if (myVote.value in counts) counts[myVote.value] += 1
  return counts
})
const totalVotes = computed(() => Object.values(votes.value).reduce((sum, value) => sum + value, 0))
const opinions = computed(() => [
  ...comments.value.map((item) => ({ ...item, sample: false })),
  ...(SAMPLE_OPINIONS[props.building?.id] ?? []).map((item) => ({ ...item, sample: true })),
].filter((item) => item.topic === props.topic))

function chooseVote(choice) {
  if (!props.building) return
  myVote.value = myVote.value === choice ? null : choice
  try {
    if (myVote.value) localStorage.setItem(voteKey(props.building.id), myVote.value)
    else localStorage.removeItem(voteKey(props.building.id))
    message.value = '意向已更新（仅保存在本机）'
  } catch { message.value = '本机存储不可用，意向只在本次页面中显示' }
}
function submit() {
  if (!props.building) return
  const text = form.value.text.trim()
  if (!text) { message.value = '请先填写意见'; return }
  const item = {
    id: Date.now(), role: form.value.role, name: form.value.name.trim().slice(0, 20) || '匿名访客',
    from: form.value.from.trim().slice(0, 20), topic: props.topic, text: text.slice(0, 500), time: new Date().toISOString(),
  }
  comments.value.unshift(item)
  try { localStorage.setItem(commentKey(props.building.id), JSON.stringify(comments.value)); message.value = '意见已发布（保存在本机）' }
  catch { message.value = '意见已显示；本机存储不可用，刷新后可能消失' }
  form.value.text = ''
}
function removeOpinion(id) {
  if (!window.confirm('删除这条本机留言？')) return
  comments.value = comments.value.filter((item) => item.id !== id)
  try { localStorage.setItem(commentKey(props.building.id), JSON.stringify(comments.value)); message.value = '本机留言已删除' }
  catch { message.value = '留言已从当前页面移除' }
}
function formatTime(time) { return new Date(time).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) }
function onKey(event) { if (event.key === 'Escape') lightbox.value = null }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <PanelCard class="participation-board" :title="building?.name || '参与设计'" en="Design Studio">
    <template #extra><span class="mock-tag">概念示意</span></template>
    <template v-if="building">
      <p class="plan-name">{{ building.plan?.title }}</p>
      <div class="tabs" role="tablist" aria-label="参与设计内容">
        <button type="button" role="tab" :aria-selected="tab === 'plan'" :class="{ active: tab === 'plan' }" @click="tab = 'plan'">现状与设想</button>
        <button type="button" role="tab" :aria-selected="tab === 'discuss'" :class="{ active: tab === 'discuss' }" @click="tab = 'discuss'">发表意见</button>
      </div>

      <div v-if="tab === 'plan'" role="tabpanel" class="tab-content">
        <p class="section-label">改造前后 · 第 {{ imageIndex + 1 }} 组</p>
        <div class="compare-grid">
          <button type="button" class="image-card" :disabled="!currentPhoto" @click="lightbox = currentPhoto && { src: assetUrl(currentPhoto.src), caption: currentPhoto.caption || '现状影像' }">
            <img v-if="currentPhoto" :src="assetUrl(currentPhoto.src)" :alt="`${building.name}现状影像`" loading="lazy" /><span>现状影像</span>
          </button>
          <button type="button" class="image-card" :disabled="!currentRendering" @click="lightbox = currentRendering && { src: assetUrl(currentRendering.src), caption: currentRendering.caption || '改造设想' }">
            <img v-if="currentRendering" :src="assetUrl(currentRendering.src)" :alt="`${building.name}改造设想`" loading="lazy" /><span>改造设想</span>
          </button>
        </div>
        <div v-if="imageCount > 1" class="image-switch" role="group" aria-label="切换图片组">
          <button v-for="(_, index) in imageCount" :key="index" type="button" :aria-pressed="imageIndex === index" :class="{ active: imageIndex === index }" @click="imageIndex = index">{{ String(index + 1).padStart(2, '0') }}</button>
        </div>
        <p class="image-note">现状照片与效果图仅按顺序并列展示，并非同机位对比。</p>
        <p class="description">{{ building.plan?.description }}</p>
        <p class="section-label">方案讨论方向</p>
        <ul class="ideas"><li v-for="idea in building.plan?.ideas" :key="idea">{{ idea }}</li></ul>
        <button type="button" class="btn btn-primary next" @click="tab = 'discuss'">参与讨论 {{ topicName }} →</button>
      </div>

      <div v-else role="tabpanel" class="tab-content">
        <p class="section-label">当前主题 · {{ topicName }}</p>
        <div class="topic-pills" role="group" aria-label="切换讨论主题">
          <button v-for="item in PARTICIPATION_TOPICS" :key="item.key" type="button" :aria-pressed="topic === item.key" :class="{ active: topic === item.key }" @click="emit('select-topic', item.key)">{{ item.label }}</button>
        </div>
        <p class="section-label vote-title">方案意向 <span class="mock-tag">示意票数</span></p>
        <div class="vote-summary"><strong>{{ totalVotes }}</strong><span>人表达意向 · 可更改选择</span></div>
        <div class="vote-buttons" role="group" aria-label="表达方案意向">
          <button v-for="(label, key) in VOTE_LABELS" :key="key" type="button" :class="{ active: myVote === key }" :aria-pressed="myVote === key" @click="chooseVote(key)"><b>{{ votes[key] }}</b><span>{{ label }}</span></button>
        </div>
        <p class="section-label opinion-title">留下你的意见</p>
        <form class="opinion-form" @submit.prevent="submit">
          <div class="form-pair">
            <label>参与身份<select v-model="form.role" class="input"><option v-for="role in PARTICIPATION_ROLES" :key="role">{{ role }}</option></select></label>
            <label>称呼（选填）<input v-model="form.name" class="input" maxlength="20" placeholder="匿名访客" /></label>
          </div>
          <label>所在地（选填）<input v-model="form.from" class="input" maxlength="20" placeholder="如：龙川" /></label>
          <label>关于「{{ topicName }}」的意见<textarea v-model="form.text" class="input" rows="3" maxlength="500" required placeholder="写下希望保留、调整或尝试的做法…"></textarea></label>
          <button type="submit" class="btn btn-primary submit">发布意见</button>
          <p class="form-note" role="status">{{ message || '样板体验：提交后立即显示，仅保存在当前浏览器。' }}</p>
        </form>
        <p class="section-label opinion-title">讨论记录 · {{ opinions.length }}</p>
        <ul class="opinion-list">
          <li v-for="item in opinions" :key="item.id">
            <div class="opinion-head"><strong>{{ item.name }}</strong><span>{{ item.role || '访客' }}</span><em v-if="item.sample">示意</em><button v-else type="button" class="remove-opinion" :aria-label="`删除${item.name}的本机留言`" @click="removeOpinion(item.id)">删除</button></div>
            <p>{{ item.text }}</p><small>{{ item.from ? `${item.from} · ` : '' }}{{ formatTime(item.time) }}</small>
          </li>
        </ul>
        <p v-if="!opinions.length" class="empty">这个主题还没有意见，欢迎先发表。</p>
      </div>
    </template>
    <p v-else>请选择一处建筑开始参与。</p>
  </PanelCard>

  <div v-if="lightbox" class="lightbox" role="dialog" aria-modal="true" :aria-label="lightbox.caption" @click.self="lightbox = null">
    <button type="button" class="lightbox-close" aria-label="关闭大图" @click="lightbox = null">×</button>
    <figure><img :src="lightbox.src" :alt="lightbox.caption" /><figcaption>{{ lightbox.caption }} · 概念示意</figcaption></figure>
  </div>
</template>

<style scoped>
.participation-board { min-height:420px; }
.plan-name { margin:0 0 10px; color:var(--gold-light); font-family:var(--font-title); font-size:var(--fs-lg); }
.tabs { display:flex; gap:6px; margin-bottom:14px; }
.tabs button { flex:1; min-height:36px; border:0; border-radius:5px; background:#c9a45c16; color:var(--text-dim); cursor:pointer; }
.tabs button.active { background:#c9a45c40; color:#fff0cf; box-shadow:inset 0 -2px var(--gold-light); }
.section-label { margin:14px 0 8px; color:var(--gold-light); font-weight:600; }
.compare-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
.image-card { position:relative; display:block; min-width:0; height:132px; overflow:hidden; padding:0; border:1px solid #c9a45c55; border-radius:7px; background:#242522; color:#fff; cursor:zoom-in; }
.image-card img { width:100%; height:100%; object-fit:cover; }
.image-card span { position:absolute; left:0; right:0; bottom:0; padding:4px 6px; background:linear-gradient(transparent,#171510dc); text-align:center; font-size:var(--fs-sm); }
.image-switch { display:flex; justify-content:center; gap:6px; margin:9px 0; }
.image-switch button { min-width:28px; min-height:28px; border:1px solid #c9a45c55; border-radius:4px; background:#c9a45c12; color:var(--text-dim); cursor:pointer; }
.image-switch button.active { background:#c9a45c55; color:#fff0cc; }
.image-note { margin:4px 0 11px; color:var(--text-dim); font-size:var(--fs-xs); line-height:1.5; }
.description { margin:0; color:var(--text-dim); line-height:1.7; }
.ideas { margin:0; padding-left:21px; line-height:1.7; }
.ideas li { margin-bottom:5px; }.ideas li::marker { color:var(--gold); }
.next,.submit { width:100%; justify-content:center; margin-top:12px; }
.topic-pills { display:flex; flex-wrap:wrap; gap:5px; }.topic-pills button { padding:5px 9px; border:1px solid #c9a45c4d; border-radius:16px; background:transparent; color:var(--text-dim); font-size:var(--fs-sm); cursor:pointer; }.topic-pills button.active { background:#c9a45c46; color:#fff0ce; border-color:var(--gold-light); }
.vote-title,.opinion-title { margin-top:18px; }.vote-title .mock-tag { font-weight:400; }
.vote-summary { display:flex; align-items:baseline; gap:8px; color:var(--text-dim); font-size:var(--fs-sm); }.vote-summary strong { color:var(--gold-light); font-family:var(--font-num); font-size:25px; }
.vote-buttons { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; margin-top:7px; }.vote-buttons button { display:grid; gap:2px; min-height:56px; padding:5px; border:1px solid #c9a45c55; border-radius:6px; background:#c9a45c13; color:var(--text); cursor:pointer; }.vote-buttons button.active { background:#c9a45c42; border-color:var(--gold-light); }.vote-buttons b { color:var(--gold-light); font-family:var(--font-num); font-size:19px; }.vote-buttons span { font-size:var(--fs-xs); }
.opinion-form { display:grid; gap:9px; }.opinion-form label { display:grid; gap:4px; color:var(--text-dim); font-size:var(--fs-sm); }.opinion-form .input { width:100%; background:#c9a45c0b; color:var(--text); }.opinion-form textarea { resize:vertical; min-height:78px; }.form-pair { display:grid; grid-template-columns:1fr 1fr; gap:8px; }.form-note { margin:0; color:var(--text-dim); font-size:var(--fs-xs); line-height:1.5; }
.opinion-list { list-style:none; display:grid; gap:8px; margin:0; padding:0; }.opinion-list li { padding:10px; border-radius:7px; background:#c9a45c10; }.opinion-head { display:flex; align-items:center; gap:7px; flex-wrap:wrap; }.opinion-head strong { color:var(--gold-light); font-weight:600; }.opinion-head span,.opinion-head em { color:var(--text-dim); font-size:var(--fs-xs); font-style:normal; }.opinion-head em { color:var(--gold); }.opinion-list p { margin:6px 0; line-height:1.55; }.opinion-list small { color:var(--text-dim); }.empty { color:var(--text-dim); }
.remove-opinion { margin-left:auto; padding:2px 4px; border:0; background:none; color:var(--text-dim); font-size:var(--fs-xs); cursor:pointer; }.remove-opinion:hover { color:var(--gold-light); }
.lightbox { position:fixed; inset:0; z-index:80; display:grid; place-items:center; padding:35px; background:#080b0de8; }.lightbox figure { max-width:min(1050px,90vw); max-height:90vh; margin:0; }.lightbox img { display:block; max-width:100%; max-height:80vh; object-fit:contain; }.lightbox figcaption { padding-top:8px; color:var(--gold-light); text-align:center; }.lightbox-close { position:absolute; top:16px; right:22px; border:0; background:none; color:#fff0cc; font-size:36px; cursor:pointer; }
</style>
