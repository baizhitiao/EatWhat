<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import TopBar from '../components/TopBar.vue'
import { store } from '../services/store.js'
import { categories, flavors } from '../data/defaultFoods.js'
import { dayLabel, filterFoods, localDate, money, recommendFood, statistics } from '../utils/meals.js'

const router = useRouter()
const filters = reactive({ maxBudget: store.preferences.defaultMaxBudget, categories: [...store.preferences.preferredCategories], flavors: [...store.preferences.preferredFlavors] })
const result = ref(null), attempted = ref(false)
// An empty budget means no limit.
const budgetValid = computed(() => filters.maxBudget === '' || (Number.isFinite(Number(filters.maxBudget)) && filters.maxBudget >= 0 && filters.maxBudget <= 10000))
const candidates = computed(() => budgetValid.value ? filterFoods(store.foods, filters) : [])
const today = computed(() => store.records.filter(record => localDate(record.eatenAt) === localDate()))
const month = computed(() => statistics(store.records))
watch(filters, () => { result.value = null; attempted.value = false }, { deep: true })
function toggle(list, item) { const index = list.indexOf(item); index < 0 ? list.push(item) : list.splice(index, 1) }
function choose() {
  attempted.value = true
  result.value = budgetValid.value ? recommendFood(store.foods, store.records, filters, store.preferences, result.value?.id) : null
}
function eat() { router.push({ path: '/records/new', query: { food: result.value.id } }) }
function reset() { filters.maxBudget = ''; filters.categories = []; filters.flavors = [] }
</script>

<template>
  <TopBar title="今天吃什么" :subtitle="dayLabel(localDate())" large>
    <RouterLink to="/stats" class="icon-btn" aria-label="统计"><AppIcon name="barChart" /></RouterLink>
  </TopBar>

  <section class="pick" aria-live="polite">
    <p class="pick-top"><span>{{ result ? '推荐你吃' : attempted ? '没有找到' : '还没决定' }}</span><span class="num">{{ candidates.length }} 个可选</span></p>
    <template v-if="result">
      <h2 class="pick-name">{{ result.name }}</h2>
      <p class="pick-tags"><span>{{ result.category }}</span><span>{{ result.flavors.join('、') }}</span><span class="num">参考 {{ money(Math.round(result.referencePrice * 100)) }}</span></p>
    </template>
    <p v-else-if="attempted" class="pick-name idle">换个条件试试</p>
    <p v-else class="pick-name idle">交给运气吧</p>
    <div class="pick-actions">
      <template v-if="result">
        <button class="btn btn-outlined with-icon" @click="choose"><AppIcon name="casino" />换一个</button>
        <button class="btn btn-filled" @click="eat">就吃这个</button>
      </template>
      <button v-else-if="attempted" class="btn btn-filled" @click="reset">清空条件</button>
      <button v-else class="btn btn-filled btn-lg btn-block with-icon" :disabled="!budgetValid" @click="choose"><AppIcon name="casino" />帮我选</button>
    </div>
    <p v-if="result" class="pick-note">记录时再填实际花费，参考价不计入统计。</p>
    <p v-else-if="attempted" class="pick-note">没有同时满足预算、品类和口味的食物。</p>
    <p v-else-if="store.preferences.avoidRecentMeals" class="pick-note">最近 {{ store.preferences.recentDays }} 天吃过的会少出现。</p>
  </section>

  <section class="section">
    <div class="subheader"><span>筛选条件</span><button class="btn btn-text" @click="reset">清空</button></div>
    <div class="card filters">
      <div>
        <label class="tf fixed prefixed" :class="{ invalid: !budgetValid }"><span class="tf-prefix">¥</span><input v-model.number="filters.maxBudget" class="tf-control num" type="number" min="0" max="10000" step="0.01" inputmode="decimal" placeholder="不限" /><span class="tf-label">预算上限（元）</span></label>
        <p class="tf-support" :class="{ invalid: !budgetValid }">{{ !budgetValid ? '请填 0–10000 元，或留空不限' : filters.maxBudget === '' ? '不限预算' : '按参考价筛选' }}</p>
      </div>
      <div role="group" aria-labelledby="category-label"><span id="category-label" class="filter-label">品类 · 不选则不限</span><div class="chips"><button v-for="category in categories" :key="category" class="chip" :class="{ on: filters.categories.includes(category) }" :aria-pressed="filters.categories.includes(category)" @click="toggle(filters.categories, category)"><AppIcon v-if="filters.categories.includes(category)" name="check" :size="18" />{{ category }}</button></div></div>
      <div role="group" aria-labelledby="flavor-label"><span id="flavor-label" class="filter-label">口味 · 不选则不限</span><div class="chips"><button v-for="flavor in flavors" :key="flavor" class="chip" :class="{ on: filters.flavors.includes(flavor) }" :aria-pressed="filters.flavors.includes(flavor)" @click="toggle(filters.flavors, flavor)"><AppIcon v-if="filters.flavors.includes(flavor)" name="check" :size="18" />{{ flavor }}</button></div></div>
    </div>
  </section>

  <section class="section">
    <div class="subheader"><span>饮食概况</span><RouterLink to="/stats" class="btn btn-text">统计</RouterLink></div>
    <div class="stat-row"><div class="stat"><span>今天</span><strong>{{ today.length }}<small>餐</small></strong></div><div class="stat"><span>本月花费</span><strong>{{ month.pricedCount ? money(month.totalCents) : '—' }}</strong></div></div>
    <RouterLink to="/records/new" class="btn btn-tonal btn-block with-icon gap-top"><AppIcon name="editNote" />不用推荐，直接记一餐</RouterLink>
  </section>
</template>
