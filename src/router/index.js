import {createWebHistory, createRouter} from "vue-router"

const routes = [
    {path:'/page1', name: 'page1', component: () => import('../view/page1.vue')},
    {path:'/buller-page',name:'buller',component:()=>import('../view/buller-page.vue')},
    {path:'/page2', name: 'page2', component: () => import('../view/page2.vue')},
    {path:'/page3', name: 'page3', component: () => import('../view/page3.vue')},
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
