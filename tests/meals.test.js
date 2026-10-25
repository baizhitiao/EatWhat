import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaultFoods, defaultPreferences } from '../src/data/defaultFoods.js'
import { createFood, createRecord, filterFoods, foodWeight, localDate, localDateTime, parseLocalDateTime, parsePrice, periodBounds, recommendFood, statistics, validFood, validRecord, validatePreferences } from '../src/utils/meals.js'

const form = { foodName: '面条', category: '面食', eatenAt: '2026-10-15T12:30', mealType: 'lunch', price: '23.50', rating: 4, note: '好吃' }
const make = overrides => createRecord({ ...form, ...overrides })

test('money is exact in cents, with zero distinct from a missing price', () => {
  assert.equal(parsePrice('0'), 0)
  assert.equal(parsePrice(''), null)
  assert.equal(parsePrice('0.10') + parsePrice('0.20'), 30)
  assert.equal(parsePrice('10000'), 1000000)
  for (const price of ['-1', '1.001', '10000.01', 'NaN', '1e2', 'Infinity']) assert.throws(() => parsePrice(price))
})

test('record validation and edits retain identity and creation time', () => {
  const original = make()
  assert.equal(validRecord(original), true)
  const edited = createRecord({ ...form, price: '0' }, original)
  assert.equal(edited.id, original.id)
  assert.equal(edited.createdAt, original.createdAt)
  assert.equal(edited.priceCents, 0)
  for (const patch of [{ foodName: ' ' }, { price: '-1' }, { category: 'bad' }, { mealType: 'bad' }, { rating: 6 }, { note: 'a'.repeat(301) }, { eatenAt: '2026-02-30T12:00' }]) assert.throws(() => make(patch))
  assert.equal(validRecord({ ...original, priceCents: NaN }), false)
  assert.equal(validRecord({ ...original, createdAt: { toString: null } }), false)
  assert.equal(validRecord({ ...original, mealType: { toString: null } }), false)
  assert.equal(validRecord(null), null)
})

test('calendar keys and date ranges use local dates including midnight boundaries', () => {
  assert.equal(localDateTime(parseLocalDateTime('2026-10-15T00:05')), '2026-10-15T00:05')
  assert.equal(localDate(new Date(2026, 9, 15, 0, 5)), '2026-10-15')
  assert.deepEqual(periodBounds('week', new Date(2026, 9, 18)), { start: '2026-10-12', end: '2026-10-19' })
  assert.deepEqual(periodBounds('month', new Date(2026, 11, 31)), { start: '2026-12-01', end: '2027-01-01' })
})

test('recommendations respect all constraints, empty sets and no consecutive repeats', () => {
  const filters = { maxBudget: 20, categories: ['面食'], flavors: ['清淡'] }
  const candidates = filterFoods(defaultFoods, filters)
  assert.ok(candidates.length > 1)
  assert.ok(candidates.every(food => food.referencePrice <= 20 && food.category === '面食' && food.flavors.includes('清淡')))
  const first = recommendFood(defaultFoods, [], filters, defaultPreferences, null, () => 0)
  const next = recommendFood(defaultFoods, [], filters, defaultPreferences, first.id, () => 0)
  assert.notEqual(first.id, next.id)
  assert.equal(recommendFood(defaultFoods, [], { ...filters, maxBudget: 0 }, defaultPreferences), null)
  assert.equal(filterFoods(defaultFoods, { maxBudget: '', categories: [], flavors: [] }).length, defaultFoods.length)
  assert.equal(recommendFood([first], [], filters, defaultPreferences, first.id).id, first.id)
  assert.equal(recommendFood([{ ...first, enabled: false }], [], filters, defaultPreferences), null)
})

test('recent food weight is lowered without excluding the only candidate', () => {
  const food = defaultFoods[0], now = new Date(2026, 9, 15, 15)
  const record = make({ foodId: food.id, foodName: food.name })
  assert.equal(foodWeight(food, [record], defaultPreferences, now), 0.2)
  assert.equal(foodWeight(food, [record], { ...defaultPreferences, avoidRecentMeals: false }, now), 1)
  assert.equal(foodWeight(food, [{ ...record, eatenAt: new Date(2026, 9, 10, 12).toISOString() }], defaultPreferences, now), 0.6)
  assert.equal(foodWeight(food, [{ ...record, eatenAt: new Date(2026, 9, 16, 12).toISOString() }], defaultPreferences, now), 1)
})

test('statistics use actual cents, correct denominators, category counts and period bounds', () => {
  const records = [make({ price: '0.10' }), make({ price: '0.20' }), make({ price: '' }), make({ price: '0' }), make({ price: '100', eatenAt: '2026-09-30T23:59' })]
  const summary = statistics(records, 'month', new Date(2026, 9, 15))
  assert.equal(summary.count, 4)
  assert.equal(summary.pricedCount, 3)
  assert.equal(summary.totalCents, 30)
  assert.equal(summary.averageCents, 10)
  assert.deepEqual(summary.categories, [{ name: '面食', value: 4 }])
  assert.deepEqual(summary.daily, [['2026-10-15', 30]])
  assert.equal(statistics([], 'month').averageCents, null)
  assert.equal(statistics([make({ price: '' })], 'all').daily.length, 0)
})

test('preferences reject damaged data', () => {
  assert.equal(validatePreferences(defaultPreferences), defaultPreferences)
  for (const patch of [{ defaultMaxBudget: -1 }, { preferredCategories: ['bad'] }, { preferredFlavors: null }, { avoidRecentMeals: 'true' }, { recentDays: 0 }]) assert.throws(() => validatePreferences({ ...defaultPreferences, ...patch }))
})

test('demo records are valid, repeatable, unique and never in the future', async () => {
  const { demoRecords } = await import('../scripts/demoData.js')
  const now = new Date(2026, 9, 19, 13, 0)
  const records = demoRecords(now)
  assert.ok(records.length > 80)
  assert.ok(records.every(record => validRecord(record) && record.id.startsWith('record_demo_') && Date.parse(record.eatenAt) <= now.getTime()))
  assert.equal(new Set(records.map(record => record.id)).size, records.length)
  assert.deepEqual(demoRecords(now), records)
  assert.ok(records.some(record => record.priceCents === null) && records.some(record => record.priceCents === 0))
  assert.ok(statistics(records, 'week', now).count > 0 && statistics(records, 'month', now).count > 0)
})

test('custom foods are validated, unique by name and keep identity when edited', () => {
  const food = createFood({ name: ' 牛肉粉 ', category: '面食', flavors: ['麻辣', '咸鲜'], price: '16.5' }, defaultFoods)
  assert.ok(validFood(food) && food.custom && food.enabled && food.id.startsWith('food_custom_'))
  assert.deepEqual([food.name, food.referencePrice, food.flavors], ['牛肉粉', 16.5, ['咸鲜', '麻辣']])
  const foods = [...defaultFoods, food]
  assert.throws(() => createFood({ name: '黄焖鸡米饭', category: '米饭', flavors: [], price: '20' }, foods), /已经有/)
  for (const bad of [{ name: '' }, { category: '其他' }, { flavors: ['甜'] }, { price: '' }, { price: '-1' }]) {
    assert.throws(() => createFood({ name: '凉面', category: '面食', flavors: [], price: '10', ...bad }, foods))
  }
  const edited = createFood({ name: '牛肉粉', category: '面食', flavors: [], price: '18' }, foods, { ...food, enabled: false })
  assert.deepEqual([edited.id, edited.enabled, edited.referencePrice], [food.id, false, 18])
  assert.equal(filterFoods([edited], { maxBudget: '', categories: [], flavors: [] }).length, 0)
})
