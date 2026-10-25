<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import RecordList from '../components/RecordList.vue'
import TopBar from '../components/TopBar.vue'
import { store } from '../services/store.js'
import { dayLabel, localDate } from '../utils/meals.js'
import { mealTypes } from '../data/defaultFoods.js'

const search = ref(''), date = ref(''), mealType = ref('')
const records = computed(() => store.records.filter(record =>
  (!search.value || record.foodName.toLowerCase().includes(search.value.trim().toLowerCase())) &&
  (!date.value || localDate(record.eatenAt) === date.value) && (!mealType.value || record.mealType === mealType.value)))
function pickDate(event) { try { event.target.showPicker?.() } catch { /* picker opens natively */ } }
function reset() { search.value = ''; date.value = ''; mealType.value = '' }
</script>

<template>
  <TopBar title="记录" :subtitle="`共 ${store.records.length} 餐`" large />
  <template v-if="store.records.length">
    <label class="search-bar"><AppIcon name="search" /><input v-model="search" type="search" aria-label="搜索食物" placeholder="搜索吃过的东西" maxlength="50" /><button v-if="search" class="icon-btn" type="button" aria-label="清除搜索" @click="search = ''"><AppIcon name="close" /></button></label>
    <div class="chips scroll filter-strip">
      <label class="chip with-icon" :class="{ on: date }"><AppIcon :name="date ? 'check' : 'today'" :size="18" />{{ date ? dayLabel(date) : '日期' }}<input v-model="date" class="chip-native" type="date" aria-label="按日期筛选" @click="pickDate" /></label>
      <button v-for="(name, key) in mealTypes" :key="key" class="chip" :class="{ on: mealType === key }" :aria-pressed="mealType === key" @click="mealType = mealType === key ? '' : key"><AppIcon v-if="mealType === key" name="check" :size="18" />{{ name }}</button>
      <button v-if="search || date || mealType" class="btn btn-text" @click="reset">清除筛选</button>
    </div>
  </template>
  <RecordList v-if="records.length" :records="records" />
  <div v-else-if="store.records.length" class="empty"><AppIcon name="search" :size="48" /><strong>没有找到</strong>换个关键词、日期或餐次试试。</div>
  <div v-else class="empty"><AppIcon name="receiptLong" :size="48" /><strong>还没有记录</strong>吃完一顿记一笔，日历和统计会跟着更新。</div>
  <Teleport to="body"><RouterLink to="/records/new" class="fab"><AppIcon name="add" />记一餐</RouterLink></Teleport>
</template>
