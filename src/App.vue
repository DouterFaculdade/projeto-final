<script setup>
import Header from "./components/Header.vue";
import Footer from "./components/Footer.vue";
</script>

<template>
  <Header/>
  <router-view/>
  <Footer/>
</template>

<style lang="scss">
@import "./assets/main.scss";
</style>
