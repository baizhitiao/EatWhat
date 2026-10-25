<script setup>
import { computed } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import TopBar from '../components/TopBar.vue'
import { categories } from '../data/defaultFoods.js'
import { store, setFoodEnabled } from '../services/store.js'
import { notify } from '../services/ui.js'
import { money } from '../utils/meals.js'

const groups = computed(() => categories.map(category => ({ category, foods: store.foods.filter(food => food.category === category) })).filter(group => group.foods.length))
const enabled = computed(() => store.foods.filter(food => food.enabled).length)
async function toggle(food, event) {
  try { await setFoodEnabled(food.id, event.target.checked) }
  catch (cause) { event.target.checked = food.enabled; notify(cause.message) }
}
</script>

<template>
  <TopBar title="食物库" back="/me" />
  <p class="hint">已启用 <span class="num">{{ enabled }}</span> / <span class="num">{{ store.foods.length }}</span> 个。关掉的食物不会被推荐；自己添加的食物点一下可以修改或删除。</p>
  <section v-for="group in groups" :key="group.category" class="section">
    <h2 class="subheader"><span>{{ group.category }} · {{ group.foods.length }} 个</span></h2>
    <div class="group">
      <div v-for="food in group.foods" :key="food.id" class="list-item two-line">
        <RouterLink v-if="food.custom" :to="`/foods/${food.id}/edit`" class="li-text food-link">
          <span class="li-headline">{{ food.name }}<span class="food-tag">自定义</span></span>
          <span class="li-support">{{ food.flavors.length ? food.flavors.join('、') : '未选口味' }} · 参考 {{ money(Math.round(food.referencePrice * 100)) }}</span>
        </RouterLink>
        <span v-else class="li-text">
          <span class="li-headline">{{ food.name }}</span>
          <span class="li-support">{{ food.flavors.join('、') }} · 参考 {{ money(Math.round(food.referencePrice * 100)) }}</span>
        </span>
        <input class="md-switch" type="checkbox" :checked="food.enabled" :disabled="store.busy" :aria-label="`推荐${food.name}`" @change="toggle(food, $event)" />
      </div>
    </div>
  </section>
  <Teleport to="body"><RouterLink to="/foods/new" class="fab"><AppIcon name="add" />添加食物</RouterLink></Teleport>
</template>
