<template>
  <div class="flex min-h-screen bg-gray-100">
    <AppSidebar />
    <main class="flex-1 p-8 overflow-auto">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
</script>