<script setup>
import icons from '../data/icons.js'

defineProps({ name: { type: String, required: true }, size: { type: Number, default: 24 } })
</script>

<template><svg class="icon" :width="size" :height="size" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path :d="icons[name]" /></svg></template>
