import { createApp } from 'vue'
import 'vant/lib/index.css'
import './assets/styles/global.css'
import App from './App.vue'
import router from './router/index.js'
import { installRipple } from './services/ui.js'

installRipple()
createApp(App).use(router).mount('#app')
