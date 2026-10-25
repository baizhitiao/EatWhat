const foods = [
  ['黄焖鸡米饭', '米饭', ['咸鲜', '微辣'], 22, '🍛'],
  ['番茄鸡蛋盖饭', '米饭', ['清淡', '酸甜'], 14, '🍅'],
  ['黑椒牛肉饭', '米饭', ['咸鲜', '微辣'], 26, '🥩'],
  ['咖喱鸡肉饭', '米饭', ['咸鲜', '微辣'], 24, '🍛'],
  ['照烧鸡腿饭', '米饭', ['咸鲜', '酸甜'], 23, '🍗'],
  ['香菇滑鸡饭', '米饭', ['清淡', '咸鲜'], 19, '🍄'],
  ['兰州牛肉面', '面食', ['咸鲜', '微辣'], 18, '🍜'],
  ['番茄鸡蛋面', '面食', ['清淡', '酸甜'], 13, '🍜'],
  ['葱油拌面', '面食', ['咸鲜'], 12, '🥢'],
  ['重庆小面', '面食', ['麻辣'], 16, '🌶️'],
  ['鲜肉馄饨', '面食', ['清淡', '咸鲜'], 15, '🥟'],
  ['香菇素饺', '面食', ['清淡'], 18, '🥟'],
  ['麻辣烫', '小吃', ['麻辣'], 25, '🍲'],
  ['酸辣粉', '小吃', ['麻辣', '酸甜'], 14, '🍜'],
  ['煎饼果子', '小吃', ['咸鲜', '微辣'], 9, '🌯'],
  ['肉夹馍', '小吃', ['咸鲜'], 12, '🥙'],
  ['鸡肉蔬菜沙拉', '轻食', ['清淡'], 28, '🥗'],
  ['全麦鸡肉三明治', '轻食', ['清淡', '咸鲜'], 20, '🥪'],
  ['时蔬沙拉', '轻食', ['清淡', '酸甜'], 18, '🥬'],
  ['南瓜小米粥', '早餐', ['清淡'], 6, '🥣'],
  ['豆浆配包子', '早餐', ['清淡', '咸鲜'], 8, '🫓'],
  ['皮蛋瘦肉粥', '早餐', ['咸鲜'], 10, '🥣'],
  ['鸡肉汉堡套餐', '快餐', ['咸鲜'], 29, '🍔'],
  ['个人披萨', '快餐', ['咸鲜', '酸甜'], 35, '🍕'],
]

export const defaultFoods = foods.map(([name, category, flavors, referencePrice, emoji], index) => ({
  id: `food_${String(index + 1).padStart(3, '0')}`,
  name, category, flavors, referencePrice, emoji, enabled: true,
  tags: category === '早餐' ? ['早餐'] : ['午餐', '晚餐'],
}))
export const categories = [...new Set(defaultFoods.map(food => food.category))]
export const flavors = ['清淡', '咸鲜', '微辣', '麻辣', '酸甜']
export const mealTypes = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }
export const defaultPreferences = {
  defaultMaxBudget: 30, preferredCategories: [], preferredFlavors: [],
  avoidRecentMeals: true, recentDays: 3,
}
