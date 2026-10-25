import { categories, flavors, mealTypes } from '../data/defaultFoods.js'

export function localDate(value = new Date()) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function localDateTime(value = new Date()) {
  const date = new Date(value)
  return `${localDate(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function dayLabel(day) {
  const [year, month, date] = day.split('-').map(Number)
  return `${month}月${date}日 周${'日一二三四五六'[new Date(year, month - 1, date).getDay()]}`
}

// Colour slot shared by record avatars and charts; unknown categories (其他) use the neutral slot 6.
export function categorySlot(category) {
  const index = categories.indexOf(category)
  return index < 0 ? 6 : index % 6
}

export const money = cents =>`¥${(cents / 100).toFixed(2)}`

export function parsePrice(value) {
  const text = String(value ?? '').trim()
  if (!text) return null
  if (!/^\d+(\.\d{1,2})?$/.test(text) || Number(text) > 10000) throw new Error('金额请输入 0–10000 元，最多两位小数')
  const [yuan, fraction = ''] = text.split('.')
  return Number(yuan) * 100 + Number(fraction.padEnd(2, '0'))
}

export function parseLocalDateTime(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('请选择有效的就餐时间')
  const date = new Date(value)
  if (!Number.isFinite(date.getTime()) || localDateTime(date) !== value || date.getFullYear() < 2000 || date.getFullYear() > 2100) {
    throw new Error('就餐时间应为 2000–2100 年内的有效日期')
  }
  return date.toISOString()
}

export function createRecord(form, previous = null) {
  const foodName = String(form.foodName ?? '').trim(), note = String(form.note ?? '').trim()
  if (!foodName || foodName.length > 50) throw new Error('食物名称需为 1–50 字')
  if (![...categories, '其他'].includes(form.category)) throw new Error('请选择有效的品类')
  if (!Object.hasOwn(mealTypes, form.mealType)) throw new Error('请选择餐次')
  if (note.length > 300) throw new Error('备注最多 300 字')
  const rating = form.rating === '' || form.rating == null ? null : Number(form.rating)
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) throw new Error('评分应为 1–5 分或留空')
  const now = new Date().toISOString()
  return {
    id: previous?.id ?? `record_${crypto.randomUUID()}`,
    foodId: form.foodId || null, foodName, category: form.category,
    eatenAt: parseLocalDateTime(form.eatenAt), mealType: form.mealType,
    priceCents: parsePrice(form.price), rating, note, photoId: null,
    createdAt: previous?.createdAt ?? now, updatedAt: now,
  }
}

export function validRecord(record) {
  return record && typeof record.id === 'string' && record.id.length > 0 &&
    typeof record.foodName === 'string' && record.foodName.trim().length > 0 && record.foodName.length <= 50 &&
    typeof record.category === 'string' && record.category.length > 0 && record.category.length <= 50 &&
    typeof record.mealType === 'string' && Object.hasOwn(mealTypes, record.mealType) &&
    typeof record.eatenAt === 'string' && Number.isFinite(Date.parse(record.eatenAt)) &&
    (record.priceCents === null || (Number.isInteger(record.priceCents) && record.priceCents >= 0 && record.priceCents <= 1000000)) &&
    (record.rating === null || (Number.isInteger(record.rating) && record.rating >= 1 && record.rating <= 5)) &&
    typeof record.note === 'string' && record.note.length <= 300 &&
    typeof record.createdAt === 'string' && Number.isFinite(Date.parse(record.createdAt)) &&
    typeof record.updatedAt === 'string' && Number.isFinite(Date.parse(record.updatedAt))
}

export function validatePreferences(value) {
  if (!value || !Number.isFinite(value.defaultMaxBudget) || value.defaultMaxBudget < 0 || value.defaultMaxBudget > 10000 ||
      !Array.isArray(value.preferredCategories) || !value.preferredCategories.every(item => categories.includes(item)) ||
      !Array.isArray(value.preferredFlavors) || !value.preferredFlavors.every(item => flavors.includes(item)) ||
      typeof value.avoidRecentMeals !== 'boolean' || !Number.isInteger(value.recentDays) || value.recentDays < 1 || value.recentDays > 30) {
    throw new Error('偏好设置无效，请检查预算、品类、口味和近期天数')
  }
  return value
}

export function filterFoods(foods, filters) {
  return foods.filter(food => food.enabled && (filters.maxBudget === '' || food.referencePrice <= filters.maxBudget) &&
    (!filters.categories.length || filters.categories.includes(food.category)) &&
    (!filters.flavors.length || filters.flavors.some(flavor => food.flavors.includes(flavor))))
}

const dayNumber = value => {
  const date = new Date(value)
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
}

export function foodWeight(food, records, preferences, now = new Date()) {
  if (!preferences.avoidRecentMeals) return 1
  let weight = 1
  for (const record of records) {
    if (record.foodId !== food.id && record.foodName !== food.name) continue
    const days = dayNumber(now) - dayNumber(record.eatenAt)
    if (days < 0 || new Date(record.eatenAt) > now) continue
    if (days < preferences.recentDays) weight = Math.min(weight, 0.2)
    else if (days < 7) weight = Math.min(weight, 0.6)
  }
  return weight
}

export function recommendFood(foods, records, filters, preferences, previousId = null, random = Math.random, now = new Date()) {
  let candidates = filterFoods(foods, filters)
  if (candidates.length > 1) candidates = candidates.filter(food => food.id !== previousId)
  if (!candidates.length) return null
  const weighted = candidates.map(food => ({ food, weight: foodWeight(food, records, preferences, now) }))
  const total = weighted.reduce((sum, item) => sum + item.weight, 0)
  if (!Number.isFinite(total) || total <= 0) return candidates[Math.floor(random() * candidates.length)]
  let ticket = random() * total
  for (const item of weighted) { ticket -= item.weight; if (ticket < 0) return item.food }
  return candidates.at(-1)
}

export function periodBounds(period, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()), end = new Date(start)
  if (period === 'week') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    end.setTime(start.getTime()); end.setDate(end.getDate() + 7)
  } else if (period === 'month') { start.setDate(1); end.setMonth(end.getMonth() + 1, 1) }
  else return { start: '0000-01-01', end: '9999-12-31' }
  return { start: localDate(start), end: localDate(end) }
}

export function statistics(records, period = 'month', now = new Date()) {
  const { start, end } = periodBounds(period, now)
  const selected = records.filter(record => { const day = localDate(record.eatenAt); return day >= start && day < end })
  const priced = selected.filter(record => record.priceCents !== null)
  const totalCents = priced.reduce((sum, record) => sum + record.priceCents, 0)
  const categories = new Map(), foods = new Map(), daily = new Map()
  for (const record of selected) {
    categories.set(record.category, (categories.get(record.category) ?? 0) + 1)
    foods.set(record.foodName, (foods.get(record.foodName) ?? 0) + 1)
    const day = localDate(record.eatenAt)
    if (record.priceCents !== null) daily.set(day, (daily.get(day) ?? 0) + record.priceCents)
  }
  return {
    count: selected.length, pricedCount: priced.length, totalCents,
    averageCents: priced.length ? Math.round(totalCents / priced.length) : null,
    categories: [...categories].map(([name, value]) => ({ name, value })),
    favorites: [...foods].sort((a, b) => b[1] - a[1]).slice(0, 5),
    daily: [...daily].sort((a, b) => a[0].localeCompare(b[0])),
  }
}

export function validFood(food) {
  return food && typeof food.id === 'string' && food.id.length > 0 &&
    typeof food.name === 'string' && food.name.trim().length > 0 && food.name.length <= 50 &&
    typeof food.category === 'string' && food.category.length > 0 &&
    Array.isArray(food.flavors) && food.flavors.every(flavor => typeof flavor === 'string') &&
    Number.isFinite(food.referencePrice) && food.referencePrice >= 0 && food.referencePrice <= 10000 &&
    typeof food.enabled === 'boolean'
}

// Builds a user-defined food; names must stay unique so records and recent-meal weighting match one food.
export function createFood(form, foods, previous = null) {
  const name = String(form.name ?? '').trim()
  if (!name || name.length > 50) throw new Error('食物名称需为 1–50 字')
  if (foods.some(food => food.id !== previous?.id && food.name === name)) throw new Error(`食物库里已经有“${name}”了`)
  if (!categories.includes(form.category)) throw new Error('请选择有效的品类')
  if (!Array.isArray(form.flavors) || !form.flavors.every(flavor => flavors.includes(flavor))) throw new Error('请选择有效的口味')
  const cents = parsePrice(form.price)
  if (cents === null) throw new Error('请填写参考价')
  return {
    id: previous?.id ?? `food_custom_${crypto.randomUUID()}`, name, category: form.category,
    flavors: flavors.filter(flavor => form.flavors.includes(flavor)),
    tags: form.category === '早餐' ? ['早餐'] : ['午餐', '晚餐'],
    referencePrice: cents / 100, emoji: previous?.emoji ?? '🍽️', enabled: previous?.enabled ?? true, custom: true,
  }
}
