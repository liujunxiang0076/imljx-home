<template>
  <QRCodeGenerator />
</template>

<script setup>
import { useHead } from '#imports'

useHead({
  title: '二维码生成器',
  link: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzQwOWVmZiIgZD0iTTMgM2g3djdIM3ptMiAydjNoM1Y1em0tMiA3aDd2N0gzem0yIDJ2M2gzdi0zem03LTlIMjJ2N2gtN3ptMiAydjNoM1Y1ek0zIDN2N2g3VjN6bTkgMHY3aDdWM3ptLTcgOXY3aDdWMTJ6Ii8+PC9zdmc+'
    }
  ]
})
</script> 
