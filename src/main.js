import { createApp } from 'vue'
import './style.css'
import Layout from './view/layout/index.vue'
import router from './router'

createApp(Layout).use(router).mount('#app')
