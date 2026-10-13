<script setup>
import { Empty as VanEmpty } from 'vant'
defineProps({ title: String, description: String })
</script>

<template>
  <header><p class="eyebrow">EATWHAT</p><h1>{{ title }}</h1></header>
  <section class="card"><VanEmpty :description="description" /></section>
</template>
