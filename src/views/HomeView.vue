<script setup>
import { Button as VanButton } from 'vant'
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <header><p class="eyebrow">EATWHAT</p><h1>今天吃什么？</h1><p>帮你决定下一餐，也记住每一餐。</p></header>
  <section class="card">
    <span class="badge">项目已初始化</span>
    <h2>从好好吃饭开始</h2>
    <p>Vue + Capacitor 已就绪。接下来将接入食物筛选、随机推荐和饮食记录。</p>
    <VanButton type="primary" block round color="#22765c" @click="router.push('/records')">查看记录入口</VanButton>
  </section>
  <p class="footnote">当前为页面骨架，尚未生成或保存饮食数据。</p>
</template>
