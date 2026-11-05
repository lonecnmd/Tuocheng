<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import EChart from '../components/charts/EChart.vue'
import { fetchBuilding } from '../api/data'
import { PARTICIPATION_TOPICS } from '../data/participationSamples'

const TABS = [
  { key: 'overview', label: '概况' },
  { key: 'history', label: '沿革' },
  { key: 'oral', label: '口述' },
  { key: 'photos', label: '影像' },
  { key: 'plan', label: '改造设想' },
  { key: 'discuss', label: '参与讨论' },
]
const VOTE_LABELS = { support: '支持', neutral: '有疑问', oppose: '建议修改' }
const VOTE_COLORS = { support: '#c9a45c', neutral: '#6f7780', oppose: '#c2452d' }
const TOPIC_LABELS = Object.fromEntries(PARTICIPATION_TOPICS.map((item) => [item.key, item.label]))
const PHOTO_BASE = `${import.meta.env.BASE_URL}data/photos/`
const assetUrl = (src) => /^(https?:)?\/\//.test(src) ? src : src.startsWith('/') ? `${import.meta.env.BASE_URL}${src.slice(1)}` : PHOTO_BASE + src

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()
const displayMode = inject('displayMode', ref('standard'))

const building = ref(null)
const loading = ref(true)
const error = ref('')
const tab = ref('overview')
const lightbox = ref(-1)
const myVote = ref(null)
const comments = ref([])
const form = ref({ name: '', from: '', text: '' })
const formMsg = ref('')
const tabEls = []
watch(tab, () => { lightbox.value = -1 })

// 本地演示存储（接入后端后替换）
const voteKey = (id) => `tuocheng.vote.${id}`
const commentKey = (id) => `tuocheng.comments.${id}`
function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

let token = 0
watch(
  () => props.id,
  async (id) => {
    const t = ++token
    loading.value = true
    error.value = ''
    tab.value = 'overview'
    lightbox.value = -1
    myVote.value = localStorage.getItem(voteKey(id))
    comments.value = readJSON(commentKey(id), [])
    try {
      const b = await fetchBuilding(id)
      if (t === token) building.value = b
    } catch (e) {
      if (t === token) error.value = e.message
    } finally {
      if (t === token) loading.value = false
    }
  },
  { immediate: true },
)

const seal = computed(() => building.value?.name?.slice(0, 1) ?? '')
const metaLine = computed(() => [building.value?.category, building.value?.era].filter(Boolean).join(' · ') || '信息待补充')

const infoRows = computed(() => {
  const b = building.value
  if (!b) return []
  return [
    ['类别', b.category],
    ['年代', b.era],
    ['结构', b.structure],
    ['层数', b.floors && `${b.floors} 层`],
    ['现状', b.status],
    ['占地面积', b.area && `${b.area} ㎡`],
    ['轮廓周长', b.perimeter && `${b.perimeter} m`],
  ].filter(([, v]) => v)
})

const photos = computed(() =>
  (building.value?.photos ?? []).map((p) => {
    const item = typeof p === 'string' ? { src: p, caption: '' } : p
    return { ...item, url: assetUrl(item.src) }
  }),
)
const renderings = computed(() => (building.value?.plan?.renderings ?? []).map((item) => ({ ...item, url: assetUrl(item.src) })))
const lightboxItems = computed(() => tab.value === 'plan' ? renderings.value : photos.value)

const votes = computed(() => {
  const base = { support: 0, neutral: 0, oppose: 0, ...(building.value?.plan?.votes ?? {}) }
  if (myVote.value in base) base[myVote.value] += 1
  return base
})
const voteTotal = computed(() => votes.value.support + votes.value.neutral + votes.value.oppose)
const supportRate = computed(() => (voteTotal.value ? Math.round((votes.value.support / voteTotal.value) * 100) : 0))

const voteOption = computed(() => ({
  color: Object.values(VOTE_COLORS),
  tooltip: {
    trigger: 'item',
    formatter: '{b}：{c} 票（{d}%）',
    backgroundColor: 'rgba(20,23,28,0.92)',
    borderColor: '#c9a45c',
    textStyle: { color: '#ece4d3', fontSize: displayMode.value === 'presentation' ? 18 : 15 },
  },
  graphic: [
    {
      type: 'text',
      left: 'center',
      top: 'center',
      style: { text: `${supportRate.value}%\n支持`, fill: '#ecd08f', font: `${displayMode.value === 'presentation' ? 24 : 20}px Bahnschrift, sans-serif`, textAlign: 'center', lineHeight: 28 },
    },
  ],
  series: [
    {
      type: 'pie',
      radius: ['60%', '82%'],
      padAngle: 2,
      itemStyle: { borderRadius: 3 },
      label: { show: false },
      data: Object.keys(VOTE_LABELS).map((k) => ({ name: VOTE_LABELS[k], value: votes.value[k] })),
    },
  ],
}))

function badge(key) {
  if (key === 'oral') return building.value?.oral?.length || 0
  if (key === 'photos') return photos.value.length
  if (key === 'plan') return renderings.value.length
  if (key === 'discuss') return comments.value.length
  return 0
}

function vote(choice) {
  myVote.value = myVote.value === choice ? null : choice
  if (myVote.value) localStorage.setItem(voteKey(props.id), myVote.value)
  else localStorage.removeItem(voteKey(props.id))
}

function submitComment() {
  const name = form.value.name.trim()
  const text = form.value.text.trim()
  if (!name || !text) {
    formMsg.value = '请填写称呼和内容'
    return
  }
  comments.value.unshift({
    id: Date.now(),
    name: name.slice(0, 20),
    from: form.value.from.trim().slice(0, 20),
    text: text.slice(0, 500),
    time: new Date().toISOString(),
  })
  localStorage.setItem(commentKey(props.id), JSON.stringify(comments.value))
  form.value.text = ''
  formMsg.value = '已发布'
}

function removeComment(cid) {
  if (!window.confirm('删除这条留言？')) return
  comments.value = comments.value.filter((c) => c.id !== cid)
  localStorage.setItem(commentKey(props.id), JSON.stringify(comments.value))
}

const formatTime = (iso) => new Date(iso).toLocaleString('zh-CN', { hour12: false })

function goBack() {
  router.push({ name: 'home' })
}

function onTabKey(e, i) {
  const n = TABS.length
  const map = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }
  if (!(e.key in map)) return
  e.preventDefault()
  tab.value = TABS[map[e.key]].key
  tabEls[map[e.key]]?.focus()
}

function stepPhoto(d) {
  const n = lightboxItems.value.length
  lightbox.value = (lightbox.value + d + n) % n
}

function onKey(e) {
  if (lightbox.value >= 0) {
    if (e.key === 'Escape') lightbox.value = -1
    else if (e.key === 'ArrowRight') stepPhoto(1)
    else if (e.key === 'ArrowLeft') stepPhoto(-1)
    return
  }
  if (e.key !== 'Escape' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
  goBack()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="detail">
    <p v-if="building" class="stage-title" aria-hidden="true">{{ building.name }}</p>
    <p class="stage-hint">模型自动环绕展示 · 拖动鼠标可自由查看</p>

    <article class="drawer" aria-labelledby="detail-title">
      <header class="drawer-head">
        <button type="button" class="btn" @click="goBack">← 返回街区</button>
        <template v-if="building">
          <div class="title-row">
            <span class="seal" aria-hidden="true">{{ seal }}</span>
            <div class="title-text">
              <h1 id="detail-title">{{ building.name }}</h1>
              <p class="sub">{{ metaLine }}</p>
            </div>
            <span v-if="building.mock" class="mock-tag">示意数据</span>
          </div>
          <ul v-if="building.tags?.length" class="tags">
            <li v-for="t in building.tags" :key="t">{{ t }}</li>
          </ul>
        </template>
        <h1 v-else id="detail-title" class="sr-only">建筑档案</h1>
      </header>

      <p v-if="loading" class="state" role="status">档案加载中…</p>
      <p v-else-if="error" class="state" role="alert">{{ error }}</p>
      <p v-else-if="!building" class="state">未找到编号为 {{ id }} 的建筑。</p>

      <template v-else>
        <div class="tabs" role="tablist" aria-label="档案分类">
          <button
            v-for="(t, i) in TABS"
            :id="`tab-${t.key}`"
            :key="t.key"
            :ref="(el) => (tabEls[i] = el)"
            type="button"
            role="tab"
            :class="{ active: tab === t.key }"
            :aria-selected="tab === t.key"
            :aria-controls="`panel-${t.key}`"
            :tabindex="tab === t.key ? 0 : -1"
            @click="tab = t.key"
            @keydown="onTabKey($event, i)"
          >
            {{ t.label }}<span v-if="badge(t.key)" class="badge">{{ badge(t.key) }}</span>
          </button>
        </div>

        <div :id="`panel-${tab}`" class="drawer-body" role="tabpanel" :aria-labelledby="`tab-${tab}`" tabindex="0">
          <!-- 概况 -->
          <section v-if="tab === 'overview'">
            <p class="summary">{{ building.summary || '档案资料收集中，欢迎补充。' }}</p>
            <div v-if="renderings.length || photos.length" class="archive-preview">
              <button v-if="photos.length" type="button" class="preview-tile" @click="tab = 'photos'">
                <img :src="photos[0].url" :alt="`${building.name}影像素材预览`" />
                <span><b>建筑影像</b><small>{{ photos.length }} 张 · 查看原图 →</small></span>
              </button>
              <button v-if="renderings.length" type="button" class="preview-tile" @click="tab = 'plan'">
                <img :src="renderings[0].url" :alt="`${building.name}改造设想预览`" />
                <span><b>改造设想</b><small>{{ renderings.length }} 张 · 查看方案 →</small></span>
              </button>
            </div>
            <dl class="info">
              <template v-for="[k, v] in infoRows" :key="k">
                <dt>{{ k }}</dt>
                <dd>{{ v }}</dd>
              </template>
            </dl>
            <template v-if="building.materials?.length">
              <h3 class="sec-title">资料收集</h3>
              <ul class="materials">
                <li v-for="m in building.materials" :key="m.name" :class="{ done: m.done }">
                  <span class="check" aria-hidden="true">{{ m.done ? '✓' : '' }}</span>
                  {{ m.name }}
                  <span class="m-state">{{ m.done ? '已收集' : '待收集' }}</span>
                </li>
              </ul>
            </template>
          </section>

          <!-- 沿革 -->
          <section v-else-if="tab === 'history'">
            <ol v-if="building.history?.length" class="timeline">
              <li v-for="h in building.history" :key="h.year + h.text">
                <span class="year">{{ h.year }}</span>
                <p>{{ h.text }} <span v-if="h.mock" class="mock-tag">示意</span></p>
              </li>
            </ol>
            <p v-else class="empty">沿革资料收集中。</p>
          </section>

          <!-- 口述 -->
          <section v-else-if="tab === 'oral'">
            <template v-if="building.oral?.length">
              <blockquote v-for="(o, i) in building.oral" :key="i" class="quote">
                <p>{{ o.text }}</p>
                <footer>—— {{ o.speaker }}</footer>
              </blockquote>
            </template>
            <p v-else class="empty">暂无口述记录。</p>
          </section>

          <!-- 影像 -->
          <section v-else-if="tab === 'photos'">
            <p v-if="photos.length" class="gallery-intro">提供的鱼眼影像按原图展示。拍摄点、时间及与建筑的对应关系仍待核实；点击图片可放大查看。</p>
            <ul v-if="photos.length" class="photos">
              <li v-for="(p, i) in photos" :key="p.url">
                <button type="button" :aria-label="`查看大图：${p.caption || `第 ${i + 1} 张`}`" @click="lightbox = i">
                  <img :src="p.url" :alt="p.caption || `${building.name} 照片 ${i + 1}`" loading="lazy" />
                </button>
                <span v-if="p.caption">{{ p.caption }}</span>
              </li>
            </ul>
            <div v-else class="empty-box">
              <p>照片收集中</p>
              <p class="hint">
                照片放到 <code>web/public/data/photos/{{ id }}/</code>，再在 buildings.json 的 photos 中登记，例如
                <code>{ "src": "{{ id }}/01.jpg", "caption": "前廊拱券" }</code>
              </p>
            </div>
          </section>

          <!-- 改造设想 -->
          <section v-else-if="tab === 'plan'">
            <template v-if="building.plan">
              <h3 class="sec-title">{{ building.plan.title }}</h3>
              <p v-if="building.plan.stage" class="plan-stage">{{ building.plan.stage }}</p>
              <p v-if="building.plan.description" class="plan-description">{{ building.plan.description }}</p>
              <div v-if="renderings.length" class="renderings">
                <figure v-for="(image, i) in renderings" :key="image.url">
                  <button type="button" :aria-label="`查看改造设想大图：${image.caption}`" @click="lightbox = i">
                    <img :src="image.url" :alt="image.caption" loading="lazy" />
                  </button>
                  <figcaption>{{ image.caption }} <em>概念示意</em></figcaption>
                </figure>
              </div>
              <h3 class="sec-title">讨论方向 <span class="mock-tag">案例示意</span></h3>
              <ol class="ideas">
                <li v-for="t in building.plan.ideas" :key="t">{{ t }}</li>
              </ol>
              <template v-if="building.plan.votes">
                <h3 class="sec-title">方案意向</h3>
                <div class="vote">
                  <EChart
                    class="vote-chart"
                    :option="voteOption"
                    :aria-label="`支持 ${votes.support} 票，中立 ${votes.neutral} 票，反对 ${votes.oppose} 票`"
                  />
                  <div class="vote-side">
                    <p>共 <b class="num">{{ voteTotal }}</b> 票</p>
                    <div class="vote-btns" role="group" aria-label="表达意向">
                      <button
                        v-for="(label, k) in VOTE_LABELS"
                        :key="k"
                        type="button"
                        class="btn"
                        :class="{ 'btn-primary': myVote === k }"
                        :aria-pressed="myVote === k"
                        @click="vote(k)"
                      >
                        <span class="swatch" :style="{ background: VOTE_COLORS[k] }" aria-hidden="true"></span>
                        {{ label }} {{ votes[k] }}
                      </button>
                    </div>
                    <p class="hint">本地演示：投票仅保存在本机浏览器</p>
                  </div>
                </div>
              </template>
            </template>
            <p v-else class="empty">改造设想尚未发布。</p>
          </section>

          <!-- 参与讨论 -->
          <section v-else-if="tab === 'discuss'">
            <form class="comment-form" @submit.prevent="submitComment">
              <div class="form-row">
                <label class="field">
                  <span>称呼</span>
                  <input v-model="form.name" class="input" maxlength="20" required />
                </label>
                <label class="field">
                  <span>所在地（选填）</span>
                  <input v-model="form.from" class="input" maxlength="20" />
                </label>
              </div>
              <label class="field">
                <span>意见或回忆</span>
                <textarea v-model="form.text" class="input" rows="3" maxlength="500" required></textarea>
              </label>
              <div class="form-foot">
                <span class="hint" role="status">{{ formMsg || '本地演示：留言仅保存在本机浏览器' }}</span>
                <button type="submit" class="btn btn-primary">发布</button>
              </div>
            </form>

            <ul v-if="comments.length" class="comments">
              <li v-for="c in comments" :key="c.id">
                <span class="avatar" aria-hidden="true">{{ c.name.slice(0, 1) }}</span>
                <div class="c-body">
                  <p class="c-head">
                    <strong>{{ c.name }}</strong>
                    <span v-if="c.role" class="dim">{{ c.role }}</span>
                    <span v-if="c.topic" class="dim">{{ TOPIC_LABELS[c.topic] || c.topic }}</span>
                    <span v-if="c.from" class="dim">{{ c.from }}</span>
                    <time class="dim" :datetime="c.time">{{ formatTime(c.time) }}</time>
                    <button type="button" class="link" @click="removeComment(c.id)">删除</button>
                  </p>
                  <p class="c-text">{{ c.text }}</p>
                </div>
              </li>
            </ul>
            <p v-else class="empty">还没有留言，来写第一条吧。</p>
          </section>
        </div>
      </template>
    </article>

    <Transition name="fade">
      <div
        v-if="lightbox >= 0 && lightboxItems[lightbox]"
        class="lightbox"
        role="dialog"
        aria-modal="true"
        :aria-label="tab === 'plan' ? '改造设想大图' : '建筑影像大图'"
        @click.self="lightbox = -1"
      >
        <img :src="lightboxItems[lightbox].url" :alt="lightboxItems[lightbox].caption || `图片 ${lightbox + 1}`" />
        <p>{{ lightboxItems[lightbox].caption }} · {{ lightbox + 1 }} / {{ lightboxItems.length }}</p>
        <button type="button" class="btn lb-close" aria-label="关闭" @click="lightbox = -1">×</button>
        <button v-if="lightboxItems.length > 1" type="button" class="btn lb-prev" aria-label="上一张" @click="stepPhoto(-1)">‹</button>
        <button v-if="lightboxItems.length > 1" type="button" class="btn lb-next" aria-label="下一张" @click="stepPhoto(1)">›</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 整层不拦截鼠标，左侧可以直接拖动模型 */
.detail { position: absolute; inset: 0; z-index: 30; pointer-events: none; }

.stage-title {
  position: absolute;
  left: 36px;
  top: calc(var(--header-h) + 30px);
  margin: 0;
  writing-mode: vertical-rl;
  font-family: var(--font-title);
  font-size: 64px;
  letter-spacing: 16px;
  color: rgba(236, 208, 143, 0.85);
  text-shadow: 0 0 24px rgba(0, 0, 0, 0.8), 0 0 4px rgba(0, 0, 0, 0.9);
}
.stage-hint {
  position: absolute;
  left: 36px;
  bottom: 24px;
  margin: 0;
  font-size: var(--fs-sm);
  letter-spacing: 2px;
  color: var(--text-dim);
  text-shadow: 0 0 6px #000;
}

.drawer {
  position: absolute;
  top: calc(var(--header-h) + 12px);
  right: 16px;
  bottom: 16px;
  width: min(740px, max(560px, 43vw)); max-width: calc(100vw - 24px);
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(30, 26, 20, 0.95), rgba(12, 14, 18, 0.94));
  border: 1px solid var(--panel-border);
  border-top: 3px solid var(--vermilion);
  border-radius: 3px;
  backdrop-filter: blur(8px);
  box-shadow: -12px 0 40px rgba(0, 0, 0, 0.5);
  pointer-events: auto;
  animation: slide-in 0.4s ease;
}
@keyframes slide-in { from { opacity: 0; transform: translateX(40px); } }

.drawer-head { padding: 14px 20px 12px; border-bottom: 1px solid rgba(201, 164, 92, 0.18); }
.title-row { display: flex; align-items: center; gap: 14px; margin-top: 14px; }
.title-text { flex: 1; }
.seal {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: var(--vermilion);
  color: #fbe9d0;
  font-family: var(--font-title);
  font-size: 34px;
  border-radius: 5px;
  box-shadow: inset 0 0 0 3px rgba(251, 233, 208, 0.55), 0 0 20px rgba(194, 69, 45, 0.4);
}
h1 { margin: 0; font-family: var(--font-title); font-size: 36px; font-weight: normal; letter-spacing: 6px; color: var(--gold-light); }
.sub { margin: 2px 0 0; color: var(--text-dim); }
.tags { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 0; padding: 0; }
.tags li { padding: 1px 8px; border: 1px solid rgba(194, 69, 45, 0.6); border-radius: 2px; font-size: var(--fs-sm); color: #f0b8a8; }

.state { padding: 24px 20px; color: var(--text-dim); }

.tabs { display: flex; flex-shrink: 0; overflow-x: auto; padding: 0 12px; border-bottom: 1px solid rgba(201, 164, 92, 0.18); }
.tabs button {
  position: relative;
  flex-shrink: 0; white-space: nowrap; padding: 12px 14px;
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: var(--fs-md);
  letter-spacing: 1px;
  cursor: pointer;
}
.tabs button:hover { color: var(--gold-light); }
.tabs button.active { color: var(--gold-light); }
.tabs button.active::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: -1px;
  height: 2px;
  background: linear-gradient(90deg, var(--vermilion), var(--gold-light));
}
.badge {
  margin-left: 4px;
  padding: 0 5px;
  border-radius: 8px;
  background: rgba(194, 69, 45, 0.7);
  color: #fff;
  font-size: var(--fs-xs);
  vertical-align: top;
}

.drawer-body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 20px 20px; line-height: 1.8; }
.drawer-body:focus-visible { outline-offset: -2px; }
.sec-title {
  margin: 18px 0 8px;
  padding-left: 10px;
  border-left: 3px solid var(--vermilion);
  font-family: var(--font-title);
  font-size: var(--fs-xl);
  font-weight: normal;
  letter-spacing: 2px;
  color: var(--gold-light);
}
.sec-title:first-child { margin-top: 0; }
.summary { margin: 0 0 14px; text-indent: 2em; text-align: justify; }
.archive-preview { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 14px 0 20px; }
.preview-tile { position: relative; min-width: 0; overflow: hidden; padding: 0; border: 1px solid rgba(201,164,92,.28); border-radius: 8px; background: #171b1c; color: var(--text); text-align: left; cursor: pointer; }
.preview-tile img { display: block; width: 100%; height: 156px; object-fit: cover; transition: transform .25s; }
.preview-tile:first-child img { object-fit: contain; }
.preview-tile:hover img { transform: scale(1.04); }
.preview-tile span { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 8px 10px; }
.preview-tile b { color: var(--gold-light); font-weight: 500; }
.preview-tile small { color: var(--text-dim); font-size: var(--fs-xs); }
.empty { color: var(--text-dim); }
.hint { margin: 4px 0 0; font-size: var(--fs-sm); color: var(--text-dim); }
code { padding: 0 4px; background: rgba(0, 0, 0, 0.4); border-radius: 2px; font-size: var(--fs-sm); color: var(--gold-light); }

.info { display: grid; grid-template-columns: 110px minmax(0, 1fr); margin: 0; border-top: 1px solid rgba(201, 164, 92, 0.15); }
.info dt, .info dd { padding: 7px 8px; border-bottom: 1px solid rgba(201, 164, 92, 0.15); }
.info dt { color: var(--text-dim); background: rgba(201, 164, 92, 0.05); }
.info dd { margin: 0; }

.materials { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 0; padding: 0; }
.materials li { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 1px dashed rgba(201, 164, 92, 0.3); }
.materials li.done { border-style: solid; border-color: var(--gold); }
.check { width: 20px; height: 20px; display: grid; place-items: center; border: 1px solid var(--gold); font-size: var(--fs-xs); color: var(--gold-light); }
.m-state { margin-left: auto; font-size: var(--fs-xs); color: var(--text-dim); }

.timeline { list-style: none; margin: 0; padding: 0 0 0 16px; border-left: 1px solid rgba(201, 164, 92, 0.35); }
.timeline li { position: relative; padding: 0 0 16px 14px; }
.timeline li::before {
  content: '';
  position: absolute;
  left: -22px;
  top: 7px;
  width: 11px;
  height: 11px;
  background: var(--ink-900);
  border: 2px solid var(--vermilion);
  transform: rotate(45deg);
}
.year { font-family: var(--font-title); font-size: var(--fs-lg); color: var(--gold-light); }
.timeline p { margin: 2px 0 0; }

.quote {
  position: relative;
  margin: 0 0 14px;
  padding: 14px 16px 10px 44px;
  background: rgba(201, 164, 92, 0.06);
  border-left: 3px solid var(--gold);
}
.quote::before {
  content: '“';
  position: absolute;
  left: 10px;
  top: -4px;
  font-family: var(--font-title);
  font-size: 48px;
  color: var(--vermilion);
}
.quote p { margin: 0; font-family: var(--font-title); font-size: var(--fs-lg); }
.quote footer { margin-top: 6px; text-align: right; font-size: var(--fs-sm); color: var(--text-dim); }

.gallery-intro, .plan-description { margin: 0 0 14px; color: var(--text-dim); line-height: 1.8; }
.photos { list-style: none; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 0; padding: 0; }
.photos button { display: block; width: 100%; padding: 0; border: 1px solid var(--panel-border); background: none; cursor: zoom-in; }
.photos img { display: block; width: 100%; aspect-ratio: 1; object-fit: contain; background: #0b0e10; }
.photos span { display: block; margin-top: 4px; font-size: var(--fs-sm); line-height: 1.5; color: var(--text-dim); }
.plan-stage { display: inline-block; margin: 0 0 12px; padding: 3px 10px; border-radius: 20px; background: rgba(194,69,45,.22); color: #f0c0ac; font-size: var(--fs-sm); }
.renderings { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 16px 0 22px; }
.renderings figure { min-width: 0; margin: 0; }
.renderings button { display: block; width: 100%; padding: 0; overflow: hidden; border: 1px solid var(--panel-border); border-radius: 8px; background: #0b0e10; cursor: zoom-in; }
.renderings img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; transition: transform .25s; }
.renderings button:hover img { transform: scale(1.04); }
.renderings figcaption { padding-top: 6px; color: var(--text-dim); font-size: var(--fs-sm); }
.renderings em { font-style: normal; color: var(--gold-light); }
.empty-box { padding: 24px; text-align: center; border: 1px dashed rgba(201, 164, 92, 0.35); }
.empty-box > p:first-child { margin: 0 0 6px; font-family: var(--font-title); font-size: 18px; color: var(--gold-light); }

.ideas { margin: 0; padding-left: 22px; }
.ideas li { margin-bottom: 6px; }
.ideas li::marker { color: var(--vermilion); font-family: var(--font-num); }
.vote { display: flex; align-items: center; gap: 16px; }
.vote-chart { flex: 0 0 170px; height: 170px; }
.vote-side { flex: 1; }
.vote-side > p:first-child { margin: 0 0 8px; }
.num { font-family: var(--font-num); font-size: 22px; font-weight: normal; color: var(--gold-light); }
.vote-btns { display: flex; flex-wrap: wrap; gap: 6px; }
.swatch { width: 8px; height: 8px; border-radius: 50%; }

.comment-form { padding: 12px; background: rgba(201, 164, 92, 0.05); border: 1px solid rgba(201, 164, 92, 0.15); }
.form-row { display: flex; gap: 10px; }
.field { display: block; flex: 1; margin-bottom: 8px; }
.field span { display: block; margin-bottom: 3px; font-size: var(--fs-sm); color: var(--text-dim); }
textarea.input { resize: vertical; }
.form-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; }

.comments { list-style: none; margin: 14px 0 0; padding: 0; }
.comments li { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px dashed rgba(201, 164, 92, 0.18); }
.avatar {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid var(--gold);
  border-radius: 50%;
  font-family: var(--font-title);
  color: var(--gold-light);
}
.c-body { flex: 1; min-width: 0; }
.c-head { display: flex; align-items: baseline; gap: 8px; margin: 0; }
.c-head strong { font-weight: normal; color: var(--gold-light); }
.dim { font-size: var(--fs-sm); color: var(--text-dim); }
.link { margin-left: auto; padding: 0; background: none; border: none; font-size: var(--fs-sm); color: var(--text-dim); cursor: pointer; }
.link:hover { color: var(--vermilion); }
.c-text { margin: 2px 0 0; white-space: pre-wrap; word-break: break-word; }

.lightbox {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(5, 6, 8, 0.92);
  pointer-events: auto;
}
.lightbox img { max-width: 86vw; max-height: 80vh; border: 1px solid var(--panel-border); }
.lightbox p { margin: 0; color: var(--text-dim); }
.lb-close { position: absolute; top: 20px; right: 24px; font-size: 20px; }
.lb-prev, .lb-next { position: absolute; top: 50%; transform: translateY(-50%); padding: 10px 14px; font-size: 24px; }
.lb-prev { left: 24px; }
.lb-next { right: 24px; }
.drawer-head { flex-shrink: 0; }
.drawer-body { overflow-wrap: anywhere; }
.materials li { flex-wrap: wrap; }
@media (max-width: 760px) {
  .drawer { top: calc(var(--header-h) + 8px); right: 10px; bottom: 10px; width: calc(100% - 20px); max-width: none; }
  .drawer-head { padding: 12px 14px; }
  .drawer-body { padding: 14px; }
  .stage-title, .stage-hint { display: none; }
  .form-row, .vote { flex-direction: column; }
  .vote-side { width: 100%; }
  .form-foot, .c-head { flex-wrap: wrap; }
  .materials { grid-template-columns: 1fr; }
  .photos, .renderings { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .archive-preview { grid-template-columns: 1fr; }
  h1 { font-size: 30px; letter-spacing: 3px; }
}
</style>
