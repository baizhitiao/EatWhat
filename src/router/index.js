import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', component: HomeView },
    { path: '/records', component: PlaceholderView, props: { title: '饮食记录', description: '在这里记录今天吃过的食物。记录功能将在后续开发中接入。' } },
    { path: '/calendar', component: PlaceholderView, props: { title: '饮食日历', description: '按日期回顾你的每一餐。日历功能将在后续开发中接入。' } },
    { path: '/me', component: PlaceholderView, props: { title: '我的', description: '查看饮食统计、设置偏好和管理本地数据。' } },
    { path: '/:pathMatch(.*)*', redirect: '/home' }
  ]
})
