import {createWebHistory, createRouter} from "vue-router"

const routes = [
    {path:'/', name: 'page2', component: () => import('../view/page2.vue')},
    {path:'/page3', name: 'page3', component: () => import('../view/page3.vue')},
    {path:'/page4', name: 'page4', component: () => import('../view/impulse.vue')},
    {path:'/buller-pagetest',name:'buller-pagetest', component: () => import('../view/buller-pagetest.vue')},
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
