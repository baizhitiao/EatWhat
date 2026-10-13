<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { App as NativeApp } from '@capacitor/app'
import { Tabbar as VanTabbar, TabbarItem as VanTabbarItem } from 'vant'

const router = useRouter()
let backListener
onMounted(async () => {
  if (!Capacitor.isNativePlatform()) return
  backListener = await NativeApp.addListener('backButton', () => {
    if (router.currentRoute.value.path !== '/home') router.replace('/home')
    else NativeApp.exitApp()
  })
})
onUnmounted(() => backListener?.remove())
</script>

<template>
  <main class="app-content"><RouterView /></main>
  <VanTabbar route safe-area-inset-bottom active-color="#22765c">
    <VanTabbarItem to="/home" icon="home-o">吃什么</VanTabbarItem>
    <VanTabbarItem to="/records" icon="records-o">记录</VanTabbarItem>
    <VanTabbarItem to="/calendar" icon="calendar-o">日历</VanTabbarItem>
    <VanTabbarItem to="/me" icon="user-o">我的</VanTabbarItem>
  </VanTabbar>
</template>
