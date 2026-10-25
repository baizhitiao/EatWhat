<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import RecordList from '../components/RecordList.vue'
import TopBar from '../components/TopBar.vue'
import { store } from '../services/store.js'
import { dayLabel, localDate, money } from '../utils/meals.js'

const selected = ref(localDate()), month = ref(localDate().slice(0, 7))
const cells = computed(() => {
  const [year, index] = month.value.split('-').map(Number)
  const first = new Date(year, index - 1, 1), length = new Date(year, index, 0).getDate()
  return [...Array((first.getDay() + 6) % 7).fill(null), ...Array.from({ length }, (_, i) => `${month.value}-${String(i + 1).padStart(2, '0')}`)]
})
const dates = computed(() => new Set(store.records.map(record => localDate(record.eatenAt))))
const records = computed(() => store.records.filter(record => localDate(record.eatenAt) === selected.value))
const paid = computed(() => records.value.filter(record => record.priceCents !== null))
const spent = computed(() => paid.value.reduce((sum, record) => sum + record.priceCents, 0))
function changeMonth(delta) {
  const [year, index] = month.value.split('-').map(Number)
  const date = new Date(year, index - 1 + delta, 1)
  if (date.getFullYear() < 2000 || date.getFullYear() > 2100) return
  month.value = localDate(date).slice(0, 7); selected.value = `${month.value}-01`
}
function today() { selected.value = localDate(); month.value = selected.value.slice(0, 7) }
</script>

<template>
  <TopBar title="日历" subtitle="有圆点的日子记过饭" large>
    <button class="icon-btn" aria-label="回到今天" @click="today"><AppIcon name="today" /></button>
  </TopBar>
  <section class="card cal">
    <div class="cal-head"><h2 class="title-small">{{ Number(month.slice(0, 4)) }}年{{ Number(month.slice(5)) }}月</h2><span><button class="icon-btn" aria-label="上个月" @click="changeMonth(-1)"><AppIcon name="chevronLeft" /></button><button class="icon-btn" aria-label="下个月" @click="changeMonth(1)"><AppIcon name="chevronRight" /></button></span></div>
    <div class="cal-grid">
      <span v-for="day in ['一', '二', '三', '四', '五', '六', '日']" :key="day" class="cal-week">{{ day }}</span>
      <span v-for="(day, index) in cells" :key="day || `blank-${index}`" class="cal-cell"><button v-if="day" class="cal-day" :class="{ on: selected === day, today: day === localDate() }" :aria-pressed="selected === day" :aria-label="`${day}${dates.has(day) ? '，有记录' : ''}`" @click="selected = day">{{ Number(day.slice(-2)) }}<i v-if="dates.has(day)" aria-hidden="true"></i></button></span>
    </div>
  </section>
  <section class="section">
    <h2 class="subheader"><span>{{ selected === localDate() ? '今天' : dayLabel(selected) }} · {{ records.length }} 餐</span><span v-if="paid.length" class="num">{{ money(spent) }}</span></h2>
    <RecordList v-if="records.length" :records="records" :show-day="false" />
    <div v-else class="empty"><AppIcon name="calendarMonth" :size="48" /><strong>这天没有记录</strong>点右下角可以补记。</div>
  </section>
  <Teleport to="body"><RouterLink :to="{ path: '/records/new', query: { date: selected } }" class="fab"><AppIcon name="add" />{{ selected === localDate() ? '记一餐' : '补记' }}</RouterLink></Teleport>
</template>
