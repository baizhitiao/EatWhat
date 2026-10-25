<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { init, use } from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, AriaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, PieChart, GridComponent, TooltipComponent, AriaComponent, CanvasRenderer])
const props = defineProps({ type: String, data: { type: Array, required: true } })
const element = ref(null)
let chart, observer
const scheme = matchMedia('(prefers-color-scheme: dark)')
function render() {
  if (!chart) return
  const style = getComputedStyle(document.documentElement), token = name => style.getPropertyValue(`--${name}`).trim()
  const common = { color: [0, 1, 2, 3, 4, 5, 6].map(index => token(`chart-${index}`)), aria: { enabled: true }, textStyle: { fontFamily: 'sans-serif', color: token('md-on-surface-variant') }, animation: false }
  chart.setOption(props.type === 'pie' ? {
    ...common, tooltip: { trigger: 'item' },
    series: [{ type: 'pie', radius: ['48%', '72%'], label: { show: false }, itemStyle: { borderColor: token('md-surface-container'), borderWidth: 2 }, data: props.data.map(({ slot, ...item }) => slot === undefined ? item : { ...item, itemStyle: { color: token(`chart-${slot}`) } }) }],
  } : {
    ...common, tooltip: { trigger: 'axis' }, grid: { left: 40, right: 12, top: 16, bottom: 28 },
    xAxis: { type: 'category', boundaryGap: false, data: props.data.map(item => item[0].slice(5)), axisLine: { lineStyle: { color: token('md-outline-variant') } }, axisTick: { show: false }, axisLabel: { color: token('md-on-surface-variant') } },
    yAxis: { type: 'value', min: 0, axisLabel: { color: token('md-on-surface-variant') }, splitLine: { lineStyle: { color: token('md-outline-variant') } } },
    series: [{ type: 'line', color: token('md-primary'), symbolSize: 6, lineStyle: { width: 2 }, areaStyle: { opacity: 0.08 }, data: props.data.map(item => item[1] / 100) }],
  }, true)
}
onMounted(() => { chart = init(element.value); render(); observer = new ResizeObserver(() => chart?.resize()); observer.observe(element.value); scheme.addEventListener('change', render) })
watch(() => props.data, render, { deep: true })
onUnmounted(() => { scheme.removeEventListener('change', render); observer?.disconnect(); chart?.dispose(); chart = null })
</script>

<template><div ref="element" class="chart" role="img" :aria-label="type === 'pie' ? '饮食品类占比图，具体数量见下方列表' : '每日消费趋势图，具体金额见下方列表'"></div></template>
