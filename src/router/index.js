import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', component: HomeView },
    { path: '/records', component: () => import('../views/RecordsView.vue') },
    { path: '/records/new', component: () => import('../views/RecordFormView.vue') },
    { path: '/records/:id/edit', component: () => import('../views/RecordFormView.vue') },
    { path: '/calendar', component: () => import('../views/CalendarView.vue') },
    { path: '/me', component: () => import('../views/ProfileView.vue') },
    { path: '/stats', component: () => import('../views/StatsView.vue') },
    { path: '/foods', component: () => import('../views/FoodsView.vue') },
    { path: '/foods/new', component: () => import('../views/FoodFormView.vue') },
    { path: '/foods/:id/edit', component: () => import('../views/FoodFormView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/home' }
  ],
  scrollBehavior: () => ({ top: 0 }),
})
