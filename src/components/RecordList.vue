<script setup>
import { computed } from 'vue'
import { categorySlot, dayLabel, localDate, money } from '../utils/meals.js'
import { mealTypes } from '../data/defaultFoods.js'

const props = defineProps({ records: { type: Array, required: true }, showDay: { type: Boolean, default: true } })
const groups = computed(() => {
  const days = new Map()
  for (const record of [...props.records].sort((a, b) => Date.parse(b.eatenAt) - Date.parse(a.eatenAt))) {
    const date = localDate(record.eatenAt)
    if (!days.has(date)) days.set(date, [])
    days.get(date).push(record)
  }
  return [...days].map(([day, meals]) => ({ day, meals, spent: meals.reduce((sum, meal) => sum + (meal.priceCents ?? 0), 0), priced: meals.some(meal => meal.priceCents !== null) }))
})
const time = value => new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
function tone(category) {
  const slot = categorySlot(category)
  return { background: `var(--cat-${slot})`, color: `var(--on-cat-${slot})` }
}
</script>

<template>
  <section v-for="group in groups" :key="group.day" :class="{ section: showDay }">
    <h2 v-if="showDay" class="subheader"><span>{{ group.day === localDate() ? '今天' : dayLabel(group.day) }} · {{ group.meals.length }} 餐</span><span v-if="group.priced" class="num">{{ money(group.spent) }}</span></h2>
    <div class="group">
      <RouterLink v-for="record in group.meals" :key="record.id" :to="`/records/${record.id}/edit`" class="list-item two-line">
        <span class="avatar" :style="tone(record.category)" aria-hidden="true">{{ record.category.slice(0, 1) }}</span>
        <span class="li-text">
          <span class="li-headline">{{ record.foodName }}</span>
          <span class="li-support">{{ mealTypes[record.mealType] }} {{ time(record.eatenAt) }} · {{ record.category }}<span v-if="record.rating" class="stars-inline" :aria-label="`${record.rating} 分`">★ {{ record.rating }}</span></span>
          <span v-if="record.note" class="li-support clamp">{{ record.note }}</span>
        </span>
        <span class="li-trailing" :class="{ strong: record.priceCents !== null }">{{ record.priceCents === null ? '未填' : money(record.priceCents) }}</span>
      </RouterLink>
    </div>
  </section>
</template>
