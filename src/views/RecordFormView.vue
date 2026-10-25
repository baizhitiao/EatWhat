<script setup>
import { computed, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import TopBar from '../components/TopBar.vue'
import { store, saveRecord, deleteRecord } from '../services/store.js'
import { categories, mealTypes } from '../data/defaultFoods.js'
import { createRecord, localDateTime } from '../utils/meals.js'
import { confirmAction, notify } from '../services/ui.js'

const route = useRoute(), router = useRouter()
const editing = Boolean(route.params.id)
const previous = store.records.find(record => record.id === route.params.id)
const food = store.foods.find(item => item.id === route.query.food)
const hour = new Date().getHours()
const form = reactive(previous ? {
  foodId: previous.foodId, foodName: previous.foodName, category: previous.category,
  mealType: previous.mealType, eatenAt: localDateTime(previous.eatenAt),
  price: previous.priceCents === null ? '' : (previous.priceCents / 100).toFixed(2),
  rating: previous.rating ?? '', note: previous.note,
} : {
  foodId: food?.id ?? null, foodName: food?.name ?? '', category: food?.category ?? '其他',
  mealType: hour < 10 ? 'breakfast' : hour < 15 ? 'lunch' : hour < 21 ? 'dinner' : 'snack',
  eatenAt: /^\d{4}-\d{2}-\d{2}$/.test(route.query.date ?? '') ? `${route.query.date}T${localDateTime().slice(11)}` : localDateTime(), price: '', rating: '', note: '',
})
const initial = JSON.stringify(form), saved = ref(false), error = ref('')
const missing = computed(() => editing && !previous)
onBeforeRouteLeave(async () => {
  if (store.busy) return false
  if (saved.value || JSON.stringify(form) === initial) return true
  return confirmAction('放弃修改？', '这次填写的内容还没有保存。', '放弃')
})
function foodChanged() { if (form.foodName !== food?.name && form.foodName !== previous?.foodName) form.foodId = null }
async function submit() {
  error.value = ''
  try {
    await saveRecord(createRecord(form, previous), editing)
    saved.value = true
    notify(editing ? '修改已保存' : '已记下这一餐')
    router.replace('/records')
  } catch (cause) { error.value = cause.message }
}
async function remove() {
  if (!await confirmAction('删除这条记录？', `“${previous.foodName}”删除后无法恢复。`, '删除', true)) return
  error.value = ''
  try { await deleteRecord(previous.id); saved.value = true; notify('记录已删除'); router.replace('/records') }
  catch (cause) { error.value = cause.message }
}
</script>

<template>
  <TopBar :title="editing ? '修改记录' : '记一餐'" back="/records" close>
    <button v-if="editing && !missing" class="icon-btn" type="button" aria-label="删除这条记录" :disabled="store.busy" @click="remove"><AppIcon name="delete" /></button>
    <button v-if="!missing" class="btn btn-filled" type="submit" form="record-form" :disabled="store.busy">{{ store.busy ? '保存中' : '保存' }}</button>
  </TopBar>
  <div v-if="missing" class="empty"><AppIcon name="receiptLong" :size="48" /><strong>这条记录已经不在了</strong><RouterLink class="btn btn-tonal" to="/records">回到记录</RouterLink></div>
  <form v-else id="record-form" class="field-group" novalidate @submit.prevent="submit">
    <p v-if="food && !editing" class="banner banner-info">来自推荐：{{ food.name }}。参考价不会计入，请填实际花费。</p>
    <label class="tf"><input v-model="form.foodName" class="tf-control" required maxlength="50" placeholder="比如：番茄鸡蛋面" @input="foodChanged" /><span class="tf-label required">吃了什么</span></label>
    <div class="field-row">
      <label class="tf fixed"><select v-model="form.category" class="tf-control"><option v-for="category in [...categories, '其他']" :key="category">{{ category }}</option></select><span class="tf-label">品类</span><AppIcon class="tf-trailing" name="arrowDropDown" /></label>
      <label class="tf fixed"><select v-model="form.mealType" class="tf-control"><option v-for="(name, key) in mealTypes" :key="key" :value="key">{{ name }}</option></select><span class="tf-label">餐次</span><AppIcon class="tf-trailing" name="arrowDropDown" /></label>
    </div>
    <label class="tf fixed"><input v-model="form.eatenAt" class="tf-control" type="datetime-local" required min="2000-01-01T00:00" max="2100-12-31T23:59" /><span class="tf-label required">时间</span></label>
    <div>
      <label class="tf fixed prefixed"><span class="tf-prefix">¥</span><input v-model="form.price" class="tf-control num" type="text" inputmode="decimal" maxlength="12" placeholder="0.00" /><span class="tf-label">实际花费</span></label>
      <p class="tf-support">可不填；免费请填 0</p>
    </div>
    <div role="group" aria-labelledby="rating-label">
      <p id="rating-label" class="rating-label"><span>评分</span><span>{{ form.rating ? `${form.rating} 分 · 再点一次取消` : '可不评' }}</span></p>
      <div class="stars"><button v-for="n in 5" :key="n" type="button" class="star-btn" :class="{ on: form.rating >= n }" :aria-pressed="form.rating === n" :aria-label="`${n} 分`" @click="form.rating = form.rating === n ? '' : n"><AppIcon :name="form.rating >= n ? 'starFill' : 'star'" :size="28" /></button></div>
    </div>
    <div>
      <label class="tf"><textarea v-model="form.note" class="tf-control" rows="3" maxlength="300" placeholder="味道、分量、下次想换什么"></textarea><span class="tf-label">备注</span></label>
      <p class="tf-support"><span>可不填</span><span class="num">{{ form.note.length }}/300</span></p>
    </div>
    <p v-if="error" class="banner banner-error" role="alert">{{ error }}</p>
  </form>
</template>
