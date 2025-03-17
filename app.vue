<template>
  <div>
    <SearchBar />
  </div>
</template>

<script setup>
import SearchBar from '~/components/search/SearchBar.vue'
useHead({
  title: 'imljx home',
  meta: [
    { name: 'description', content: 'imljx的个人主页' }
  ]
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Arial', sans-serif;
}

body {
  overflow: hidden;
}
</style>
