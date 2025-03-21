<template>
  <div>
    <SearchBar />
    <ShortcutBar />
  </div>
</template>

<script setup>
import SearchBar from '~/components/search/SearchBar.vue'
import ShortcutBar from '~/components/shortcut/ShortcutBar.vue'

useHead({
  title: '首页'
})
</script> 
