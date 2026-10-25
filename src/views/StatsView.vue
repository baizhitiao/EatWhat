<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import StatsChart from '../components/StatsChart.vue'
import TopBar from '../components/TopBar.vue'
import { store } from '../services/store.js'
import { categorySlot, dayLabel, statistics, money } from '../utils/meals.js'

const period = ref('month')
const summary = computed(() => statistics(store.records, period.value))
const categoryData = computed(() => summary.value.categories.map(item => ({ ...item, slot: categorySlot(item.name) })))
</script>

<template>
  <TopBar title="统计" back="/me" />
  <div class="segmented" role="group" aria-label="统计时间范围"><button v-for="[value, label] in [['week', '本周'], ['month', '本月'], ['all', '全部']]" :key="value" :class="{ on: period === value }" :aria-pressed="period === value" @click="period = value"><AppIcon v-if="period === value" name="check" :size="18" />{{ label }}</button></div>
  <div class="stat-grid">
    <div class="stat"><span>吃了</span><strong>{{ summary.count }}<small>餐</small></strong></div>
    <div class="stat"><span>花了</span><strong>{{ summary.pricedCount ? money(summary.totalCents) : '—' }}</strong></div>
    <div class="stat"><span>平均每餐</span><strong>{{ summary.averageCents === null ? '—' : money(summary.averageCents) }}</strong></div>
    <div class="stat"><span>填了金额</span><strong>{{ summary.pricedCount }}<small>餐</small></strong></div>
  </div>
  <div v-if="!summary.count" class="empty"><AppIcon name="barChart" :size="48" /><strong>这段时间没有记录</strong>记几餐之后再来看看。</div>
  <template v-else>
    <section class="section">
      <h2 class="subheader">每日花费（元）</h2>
      <div class="card card-pad"><template v-if="summary.daily.length"><StatsChart type="line" :data="summary.daily" /><details><summary>查看每天的金额</summary><div class="group"><div v-for="[day, cents] in summary.daily" :key="day" class="list-item"><span class="li-text">{{ dayLabel(day) }}</span><span class="li-trailing">{{ money(cents) }}</span></div></div></details></template><p v-else class="empty">这段时间的记录都没填金额。</p></div>
    </section>
    <section class="section">
      <h2 class="subheader">品类</h2>
      <div class="card card-pad"><StatsChart type="pie" :data="categoryData" /></div>
      <div class="group joined"><div v-for="item in categoryData" :key="item.name" class="list-item"><span class="legend-dot" :style="{ background: `var(--chart-${item.slot})` }"></span><span class="li-text">{{ item.name }}</span><span class="li-trailing">{{ item.value }} 餐 · {{ Math.round(item.value / summary.count * 100) }}%</span></div></div>
    </section>
    <section class="section">
      <h2 class="subheader">吃得最多</h2>
      <ol class="group plain-list"><li v-for="([name, count], index) in summary.favorites" :key="name" class="list-item"><span class="rank-no">{{ index + 1 }}</span><span class="li-text">{{ name }}</span><span class="li-trailing">{{ count }} 次</span></li></ol>
    </section>
  </template>
  <p class="footnote">只统计填了的实际花费：没填金额的不算进总额和平均，填 0 的会算，参考价从不计入。按手机本地日期，一周从周一算起。</p>
</template>
