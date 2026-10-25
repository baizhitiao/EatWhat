<script setup>
import AppIcon from './AppIcon.vue'

defineProps({ title: { type: String, required: true }, subtitle: String, back: String, close: Boolean, large: Boolean })
</script>

<template>
  <header class="topbar" :class="{ large }">
    <div class="topbar-row">
      <RouterLink v-if="back" :to="back" class="icon-btn" :aria-label="close ? '关闭' : '返回'"><AppIcon :name="close ? 'close' : 'arrowBack'" /></RouterLink>
      <h1 class="topbar-title" :aria-hidden="large">{{ title }}</h1>
      <div class="topbar-actions"><slot /></div>
    </div>
  </header>
  <div v-if="large" class="large-title"><h1>{{ title }}</h1><p v-if="subtitle">{{ subtitle }}</p></div>
</template>
