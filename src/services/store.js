import { reactive } from 'vue'
import { defaultFoods, defaultPreferences } from '../data/defaultFoods.js'
import { validFood, validRecord, validatePreferences } from '../utils/meals.js'
import { readData, writeData, backupData } from './storage.js'

export const store = reactive({
  ready: false, loading: false, error: '', warning: '', busy: false,
  foods: defaultFoods, records: [], preferences: structuredClone(defaultPreferences),
})

async function loadChecked(key, fallback, repair) {
  let value
  try { value = await readData(key) } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    await backupData(key)
    store.warning = '部分本地数据损坏，已保留原始副本并恢复可用数据。'
    await writeData(key, fallback)
    return structuredClone(fallback)
  }
  if (value === undefined) { await writeData(key, fallback); return structuredClone(fallback) }
  const fixed = repair(value)
  if (JSON.stringify(fixed) !== JSON.stringify(value)) {
    await backupData(key)
    await writeData(key, fixed)
    store.warning = '部分本地数据无效，已保留原始副本并恢复可用数据。'
  }
  return fixed
}

export async function initialize() {
  if (store.loading || store.ready) return
  store.loading = true
  store.error = ''
  try {
    const version = await readData('version', 1)
    if (version !== 1) throw new Error('本地数据版本较新，请更新应用后再打开')
    store.records = await loadChecked('records', [], value => {
      const seen = new Set()
      return Array.isArray(value) ? value.filter(record => {
        if (!validRecord(record) || seen.has(record.id)) return false
        seen.add(record.id)
        return true
      }) : []
    })
    store.preferences = await loadChecked('preferences', defaultPreferences, value => {
      try { return validatePreferences(value) } catch { return structuredClone(defaultPreferences) }
    })
    // Drop only the invalid foods so one bad entry cannot wipe the user's own foods.
    store.foods = await loadChecked('foods', defaultFoods, value => {
      const seen = new Set()
      const foods = Array.isArray(value) ? value.filter(food => {
        if (!validFood(food) || seen.has(food.id)) return false
        seen.add(food.id)
        return true
      }) : []
      return foods.length ? foods : structuredClone(defaultFoods)
    })
    await writeData('version', 1)
    store.ready = true
  } catch (error) { store.error = `无法读取或初始化本地数据：${error.message}。请检查存储权限后重试。` }
  finally { store.loading = false }
}

async function commit(key, value) {
  // ponytail: one JSON list suits hundreds of meals; use SQLite for large histories.
  if (store.busy) throw new Error('正在保存，请稍候')
  if (!store.ready) throw new Error('本地数据尚未就绪')
  store.busy = true
  try { await writeData(key, value); store[key] = value }
  catch { throw new Error('保存失败，请检查存储空间或权限；当前修改尚未保存') }
  finally { store.busy = false }
}

export async function saveRecord(record, editing = false) {
  if (!validRecord(record)) throw new Error('记录数据无效')
  const exists = store.records.some(item => item.id === record.id)
  if (editing && !exists) throw new Error('这条记录已不存在，请返回记录列表')
  await commit('records', exists ? store.records.map(item => item.id === record.id ? record : item) : [...store.records, record])
}

export const deleteRecord = id => commit('records', store.records.filter(record => record.id !== id))
export const savePreferences = value => commit('preferences', JSON.parse(JSON.stringify(validatePreferences(value))))
export const clearRecords = () => commit('records', [])

export async function saveFood(food) {
  if (!validFood(food)) throw new Error('食物数据无效')
  const exists = store.foods.some(item => item.id === food.id)
  await commit('foods', exists ? store.foods.map(item => item.id === food.id ? food : item) : [...store.foods, food])
}

export const setFoodEnabled = (id, enabled) => commit('foods', store.foods.map(food => food.id === id ? { ...food, enabled } : food))
// Built-in foods can only be switched off; past records keep their own name and category snapshot.
export const deleteFood = id => commit('foods', store.foods.filter(food => food.id !== id || !food.custom))
