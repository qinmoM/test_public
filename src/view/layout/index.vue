<template>
    <div class="layout-header">

    </div>
    <div class="layout-content">
        <div class="nav">
            <RouterLink to="/page1" class="nav-items">冲量</RouterLink>
            <RouterLink to='/page2' class="nav-items">弹性碰撞</RouterLink>
            <RouterLink to="/page3" class="nav-items">动量守恒</RouterLink>
        </div>
        <div class="main-content"> 
            <router-view></router-view>
        </div>
    </div>
</template>
<script setup>
import { RouterLink } from 'vue-router';
import router from '../../router';

</script>
<style>
.layout-header {
    position: relative;
    margin: 0;
    padding: 0;
    width: 100%;
    height: 50px;
    background-color: #f0f0f0;
}
.layout-content{
    display: flex;
    margin: 0;
    padding: 0;
    width: 100%;
    height: calc(100vh - 50px);
}
.nav{
    display: flex;
    flex-direction: column;
    width: 200px;
    height: 100%;
    padding: 5px;
    background-color: #f0f0f0;
}
.nav-items{
    width: 100%;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(rgb(248, 184, 184), rgb(183, 241, 183), rgb(133, 133, 236), 1);
    box-sizing: border-box;
    box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.2);
}

.nav-items:hover{
    background-color: chartreuse;
    box-shadow: 1px 2px 5px chartreuse;
}
</style>