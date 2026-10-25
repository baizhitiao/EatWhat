<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { App as NativeApp } from '@capacitor/app'
import AppIcon from './components/AppIcon.vue'
import { store, initialize } from './services/store.js'
import { dismissDialog } from './services/ui.js'

const router = useRouter(), route = useRoute()
const tabs = [
  { path: '/home', label: '吃什么', icon: 'restaurant' },
  { path: '/records', label: '记录', icon: 'receiptLong' },
  { path: '/calendar', label: '日历', icon: 'calendarMonth' },
  { path: '/me', label: '我的', icon: 'person' },
]
const isTab = computed(() => tabs.some(tab => tab.path === route.path))
const hasFab = computed(() => ['/records', '/calendar', '/foods'].includes(route.path))
let backListener
let disposed = false
function onScroll() {
  document.documentElement.classList.toggle('scrolled', scrollY > 0)
  document.documentElement.classList.toggle('collapsed', scrollY > 28)
}
onMounted(async () => {
  addEventListener('scroll', onScroll, { passive: true })
  await initialize()
  if (!Capacitor.isNativePlatform()) return
  backListener = await NativeApp.addListener('backButton', () => {
    if (dismissDialog()) return
    const path = router.currentRoute.value.path
    if (path.startsWith('/records/')) router.replace('/records')
    else if (path.startsWith('/foods/')) router.replace('/foods')
    else if (path === '/stats' || path === '/foods') router.replace('/me')
    else if (path !== '/home') router.replace('/home')
    else NativeApp.exitApp()
  })
  if (disposed) backListener.remove()
})
onUnmounted(() => { disposed = true; backListener?.remove(); removeEventListener('scroll', onScroll) })
</script>

<template>
  <main class="app-content" :class="{ 'has-nav': store.ready && isTab, 'has-fab': store.ready && hasFab }">
    <section v-if="store.error" class="boot" role="alert"><h1>无法读取数据</h1><p>{{ store.error }}</p><button class="btn btn-filled" :disabled="store.loading" @click="initialize">重试</button></section>
    <section v-else-if="!store.ready" class="boot" role="status" aria-label="正在读取"><div class="spinner"></div></section>
    <template v-else>
      <p v-if="store.warning" class="banner banner-info" role="status">{{ store.warning }}</p>
      <RouterView v-slot="{ Component, route: current }"><Transition name="fade-through" mode="out-in"><component :is="Component" :key="current.fullPath" /></Transition></RouterView>
    </template>
  </main>
  <nav v-if="store.ready && isTab" class="nav" aria-label="主导航">
    <div class="nav-inner">
      <RouterLink v-for="tab in tabs" :key="tab.path" :to="tab.path" class="nav-item" :class="{ on: route.path === tab.path }" :aria-current="route.path === tab.path ? 'page' : undefined">
        <span class="nav-ind"><AppIcon :name="route.path === tab.path ? `${tab.icon}Fill` : tab.icon" /></span>{{ tab.label }}
      </RouterLink>
    </div>
  </nav>
</template>
