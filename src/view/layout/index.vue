<template>
    <div class="layout-header">
        冲量模拟系统
    </div>
    <div class="layout-content">
        <div class="nav">
            <RouterLink to='/' class="nav-items">弹性碰撞</RouterLink>
            <RouterLink to="/page3" class="nav-items">动量守恒--牛顿摆</RouterLink>
            <RouterLink to="/buller-pagetest" class="nav-items">冲量1--子弹射击木块</RouterLink>
            <RouterLink to="/page4" class="nav-items">冲量2--反冲</RouterLink>
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
    letter-spacing: 10px;
    background-color: #f0f0f0;
    text-align: center;
    line-height: 50px;
    font-size: 25px;
    box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.2);
    text-shadow: 
    1px 1px 0 #ccc,
    2px 2px 0 #bbb,
    5px 5px 5px rgba(0,0,0,0.6);
}
.layout-content{
    display: flex;
    margin: 0;
    padding: 0;
    width: 100%;
    height: calc(100vh - 60px);
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
.main-content{
    margin: 0;
    padding: 5px;
    width: 100%;
    height: 100%;
}
.nav-items:hover{
    background-color: chartreuse;
    box-shadow: 1px 2px 5px chartreuse;
}
</style>