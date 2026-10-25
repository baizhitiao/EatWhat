<script setup>
import { reactive, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import TopBar from '../components/TopBar.vue'
import { categories, flavors } from '../data/defaultFoods.js'
import { store, savePreferences, clearRecords } from '../services/store.js'
import { confirmAction, notify } from '../services/ui.js'

const form = reactive(JSON.parse(JSON.stringify(store.preferences)))
const error = ref('')
function toggle(list, value) { const index = list.indexOf(value); index < 0 ? list.push(value) : list.splice(index, 1) }
async function save() {
  error.value = ''
  try { await savePreferences(form); notify('偏好已保存') } catch (cause) { error.value = cause.message }
}
async function clear() {
  if (!await confirmAction('清空所有记录？', `${store.records.length} 条记录会全部删除，日历和统计一起清空，无法恢复。偏好设置会保留。`, '清空', true)) return
  error.value = ''
  try { await clearRecords(); notify('记录已清空') } catch (cause) { error.value = cause.message }
}
</script>

<template>
  <TopBar title="我的" subtitle="数据只保存在这台手机上" large />
  <div class="group">
    <RouterLink to="/stats" class="list-item two-line"><AppIcon class="li-icon" name="barChart" /><span class="li-text"><span class="li-headline">饮食统计</span><span class="li-support">花费、品类和常吃的食物</span></span><AppIcon class="li-icon" name="chevronRight" /></RouterLink>
    <RouterLink to="/foods" class="list-item two-line"><AppIcon class="li-icon" name="restaurant" /><span class="li-text"><span class="li-headline">食物库</span><span class="li-support">添加食物，选择哪些参与推荐</span></span><AppIcon class="li-icon" name="chevronRight" /></RouterLink>
  </div>

  <form class="section" @submit.prevent="save">
    <h2 class="subheader">推荐偏好</h2>
    <div class="group">
      <div class="filters">
        <label class="tf fixed prefixed"><span class="tf-prefix">¥</span><input v-model.number="form.defaultMaxBudget" class="tf-control num" type="number" required min="0" max="10000" step="0.01" inputmode="decimal" /><span class="tf-label">默认预算上限（元）</span></label>
        <div role="group" aria-labelledby="pref-category"><span id="pref-category" class="filter-label">常吃的品类</span><div class="chips"><button v-for="category in categories" :key="category" type="button" class="chip" :class="{ on: form.preferredCategories.includes(category) }" :aria-pressed="form.preferredCategories.includes(category)" @click="toggle(form.preferredCategories, category)"><AppIcon v-if="form.preferredCategories.includes(category)" name="check" :size="18" />{{ category }}</button></div></div>
        <div role="group" aria-labelledby="pref-flavor"><span id="pref-flavor" class="filter-label">常吃的口味</span><div class="chips"><button v-for="flavor in flavors" :key="flavor" type="button" class="chip" :class="{ on: form.preferredFlavors.includes(flavor) }" :aria-pressed="form.preferredFlavors.includes(flavor)" @click="toggle(form.preferredFlavors, flavor)"><AppIcon v-if="form.preferredFlavors.includes(flavor)" name="check" :size="18" />{{ flavor }}</button></div></div>
      </div>
      <label class="list-item two-line"><span class="li-text"><span class="li-headline">少推最近吃过的</span><span class="li-support">降低概率，不会完全排除</span></span><input v-model="form.avoidRecentMeals" class="md-switch" type="checkbox" /></label>
      <div v-if="form.avoidRecentMeals" class="filters"><label class="tf fixed"><select v-model.number="form.recentDays" class="tf-control"><option v-for="days in [1, 3, 7, 14, 30]" :key="days" :value="days">{{ days }} 天内</option></select><span class="tf-label">“最近”的范围</span><AppIcon class="tf-trailing" name="arrowDropDown" /></label></div>
    </div>
    <p class="hint">这些会作为首页的默认筛选条件。</p>
    <p v-if="error" class="banner banner-error gap-top" role="alert">{{ error }}</p>
    <button class="btn btn-filled btn-block gap-top" type="submit" :disabled="store.busy">{{ store.busy ? '保存中…' : '保存偏好' }}</button>
  </form>

  <section class="section">
    <h2 class="subheader">数据</h2>
    <div class="group">
      <div class="list-item two-line"><AppIcon class="li-icon" name="receiptLong" /><span class="li-text"><span class="li-headline">已存 <span class="num">{{ store.records.length }}</span> 条记录</span><span class="li-support">没有云备份，卸载或清除应用数据后无法找回</span></span></div>
      <button class="list-item danger" type="button" :disabled="store.busy || !store.records.length" @click="clear"><AppIcon class="li-icon" name="delete" /><span class="li-text"><span class="li-headline">清空所有记录</span></span></button>
    </div>
  </section>
  <p class="footnote">EatWhat 0.1 · 离线可用，无需登录</p>
</template>
