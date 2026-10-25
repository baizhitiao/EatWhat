import { defaultFoods } from '../src/data/defaultFoods.js'
import { localDate } from '../src/utils/meals.js'

// Sample meals for the demo phone, written by scripts/seed-device.js. Ids start with record_demo_ so they are recognisable,
// and each day uses its own fixed seed, so reseeding on the same day gives the same meals.

const food = name => {
  const item = defaultFoods.find(entry => entry.name === name)
  return { foodId: item.id, foodName: item.name, category: item.category, price: item.referencePrice }
}
const custom = (foodName, category, price) => ({ foodId: null, foodName, category, price })

const menus = {
  breakfast: [food('豆浆配包子'), food('南瓜小米粥'), food('皮蛋瘦肉粥'), food('煎饼果子'), food('肉夹馍'), custom('鸡蛋灌饼', '早餐', 7)],
  lunch: [custom('食堂两荤一素', '其他', 13), custom('食堂两荤一素', '其他', 13), food('黄焖鸡米饭'), food('兰州牛肉面'), food('番茄鸡蛋盖饭'),
    food('香菇滑鸡饭'), food('重庆小面'), food('麻辣烫'), food('鲜肉馄饨'), food('咖喱鸡肉饭'), food('葱油拌面')],
  dinner: [custom('食堂两荤一素', '其他', 13), food('照烧鸡腿饭'), food('黑椒牛肉饭'), food('番茄鸡蛋面'), food('酸辣粉'), food('鸡肉蔬菜沙拉'),
    food('全麦鸡肉三明治'), food('时蔬沙拉'), food('香菇素饺'), food('麻辣烫'), food('鸡肉汉堡套餐')],
  weekend: [food('鸡肉汉堡套餐'), food('个人披萨'), food('黑椒牛肉饭'), food('麻辣烫'), custom('火锅（AA）', '其他', 68)],
  snack: [custom('珍珠奶茶', '其他', 13), custom('水果捞', '其他', 15), custom('烤冷面', '小吃', 9), custom('关东煮', '小吃', 12)],
}
const notes = ['排队有点久', '分量很足', '有点咸', '加了个蛋', '和室友一起', '下次换个口味', '辣度刚好', '外卖，送得有点慢', '新开的窗口，还不错', '性价比很高']
const slots = [['breakfast', 7, 20, 80, 0.65], ['lunch', 11, 30, 80, 0.97], ['dinner', 17, 30, 120, 0.9], ['snack', 15, 0, 390, 0.22]]

function random(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function demoRecords(now = new Date(), days = 42) {
  const records = []
  for (let offset = 0; offset < days; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
    const key = localDate(day), next = random(Number(key.replaceAll('-', '')))
    const weekend = day.getDay() === 0 || day.getDay() === 6
    for (const [mealType, hour, minute, spread, chance] of slots) {
      if (next() > (mealType === 'snack' && weekend ? chance + 0.15 : chance)) continue
      const menu = mealType === 'dinner' && weekend && next() < 0.5 ? menus.weekend : menus[mealType]
      const meal = menu[Math.floor(next() * menu.length)]
      const eaten = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute + Math.floor(next() * spread))
      if (eaten > now) continue
      const roll = next()
      const priceCents = roll < 0.06 ? null : roll < 0.08 ? 0 : Math.round(meal.price * (0.85 + next() * 0.35) * 2) * 50
      const rating = next() < 0.55 ? [3, 4, 4, 4, 5, 5][Math.floor(next() * 6)] : null
      const note = priceCents === 0 ? '室友请客' : next() < 0.15 ? notes[Math.floor(next() * notes.length)] : ''
      const saved = new Date(Math.min(eaten.getTime() + 20 * 60000, now.getTime())).toISOString()
      records.push({
        id: `record_demo_${key}_${mealType}`, foodId: meal.foodId, foodName: meal.foodName, category: meal.category,
        eatenAt: eaten.toISOString(), mealType, priceCents, rating, note, photoId: null, createdAt: saved, updatedAt: saved,
      })
    }
  }
  return records
}
