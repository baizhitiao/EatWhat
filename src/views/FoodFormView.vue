<script setup>
import { computed, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import TopBar from '../components/TopBar.vue'
import { store, saveFood, deleteFood } from '../services/store.js'
import { categories, flavors } from '../data/defaultFoods.js'
import { createFood } from '../utils/meals.js'
import { confirmAction, notify } from '../services/ui.js'

const route = useRoute(), router = useRouter()
const editing = Boolean(route.params.id)
const previous = store.foods.find(food => food.id === route.params.id && food.custom)
const form = reactive(previous
  ? { name: previous.name, category: previous.category, flavors: [...previous.flavors], price: String(previous.referencePrice) }
  : { name: '', category: categories[0], flavors: [], price: '' })
const initial = JSON.stringify(form), saved = ref(false), error = ref('')
const missing = computed(() => editing && !previous)
onBeforeRouteLeave(async () => {
  if (store.busy) return false
  if (saved.value || JSON.stringify(form) === initial) return true
  return confirmAction('放弃修改？', '这次填写的内容还没有保存。', '放弃')
})
function toggle(list, value) { const index = list.indexOf(value); index < 0 ? list.push(value) : list.splice(index, 1) }
async function submit() {
  error.value = ''
  try {
    await saveFood(createFood(form, store.foods, previous))
    saved.value = true
    notify(editing ? '食物已修改' : '已加入食物库')
    router.replace('/foods')
  } catch (cause) { error.value = cause.message }
}
async function remove() {
  if (!await confirmAction('删除这个食物？', `“${previous.name}”会从食物库移除，不再被推荐；已有的饮食记录不受影响。`, '删除', true)) return
  error.value = ''
  try { await deleteFood(previous.id); saved.value = true; notify('食物已删除'); router.replace('/foods') }
  catch (cause) { error.value = cause.message }
}
</script>

<template>
  <TopBar :title="editing ? '修改食物' : '添加食物'" back="/foods" close>
    <button v-if="editing && !missing" class="icon-btn" type="button" aria-label="删除这个食物" :disabled="store.busy" @click="remove"><AppIcon name="delete" /></button>
    <button v-if="!missing" class="btn btn-filled" type="submit" form="food-form" :disabled="store.busy">{{ store.busy ? '保存中' : '保存' }}</button>
  </TopBar>
  <div v-if="missing" class="empty"><AppIcon name="restaurant" :size="48" /><strong>这个食物已经不在了</strong><RouterLink class="btn btn-tonal" to="/foods">回到食物库</RouterLink></div>
  <form v-else id="food-form" class="field-group" novalidate @submit.prevent="submit">
    <label class="tf"><input v-model="form.name" class="tf-control" required maxlength="50" placeholder="比如：牛肉粉" /><span class="tf-label required">食物名称</span></label>
    <label class="tf fixed"><select v-model="form.category" class="tf-control"><option v-for="category in categories" :key="category">{{ category }}</option></select><span class="tf-label">品类</span><AppIcon class="tf-trailing" name="arrowDropDown" /></label>
    <div role="group" aria-labelledby="food-flavor"><span id="food-flavor" class="filter-label">口味 · 可多选</span><div class="chips"><button v-for="flavor in flavors" :key="flavor" type="button" class="chip" :class="{ on: form.flavors.includes(flavor) }" :aria-pressed="form.flavors.includes(flavor)" @click="toggle(form.flavors, flavor)"><AppIcon v-if="form.flavors.includes(flavor)" name="check" :size="18" />{{ flavor }}</button></div></div>
    <div>
      <label class="tf fixed prefixed"><span class="tf-prefix">¥</span><input v-model="form.price" class="tf-control num" type="text" inputmode="decimal" maxlength="12" placeholder="0.00" /><span class="tf-label required">参考价</span></label>
      <p class="tf-support">只用于按预算筛选推荐，不计入统计</p>
    </div>
    <p v-if="error" class="banner banner-error" role="alert">{{ error }}</p>
  </form>
</template>
