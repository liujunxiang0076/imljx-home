<template>
  <div>
    <WelcomeToast />
    <SearchBar />
    <ShortcutBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useHead } from '#imports'
import SearchBar from '~/components/search/SearchBar.vue'
import ShortcutBar from '~/components/shortcut/ShortcutBar.vue'
import WelcomeToast from '~/components/common/WelcomeToast.vue'

useHead({
  title: '首页'
})
</script> 
