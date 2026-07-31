<template>
  <aside class="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
    <div class="p-6 border-b border-gray-700">
      <h2 class="text-lg font-bold">Certificados</h2>
      <p class="text-xs text-gray-400 mt-1">{{ auth.user?.name }}</p>
      <span class="text-xs bg-blue-600 px-2 py-0.5 rounded mt-1 inline-block">{{ auth.user?.role }}</span>
    </div>

    <nav class="flex-1 p-4 space-y-1">
      <RouterLink to="/dashboard" class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 text-sm"
        active-class="bg-gray-700">
        📊 Dashboard
      </RouterLink>

      <template v-if="auth.role === 'SUPER_ADMIN'">
        <RouterLink to="/usuarios" class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 text-sm"
          active-class="bg-gray-700">
          👥 Usuarios
        </RouterLink>
        <RouterLink to="/cursos" class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 text-sm"
          active-class="bg-gray-700">
          📚 Cursos
        </RouterLink>
        <RouterLink to="/informes" class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 text-sm"
          active-class="bg-gray-700">
          📊 Informes
        </RouterLink>
        <RouterLink to="/importar" class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 text-sm"
          active-class="bg-gray-700">
          📥 Importar CSV
        </RouterLink>
      </template>

      <template v-if="auth.role === 'SUPER_ADMIN' || auth.role === 'STAFF'">
        <RouterLink to="/certificados" class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 text-sm"
          active-class="bg-gray-700">
          🎓 Certificados
        </RouterLink>
      </template>

      <template v-if="auth.role === 'STUDENT'">
        <RouterLink to="/mis-certificados"
          class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 text-sm" active-class="bg-gray-700">
          🎓 Mis Certificados
        </RouterLink>
      </template>

      <RouterLink to="/perfil" class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 text-sm"
        active-class="bg-gray-700">
        👤 Mi Perfil
      </RouterLink>
    </nav>

    <div class="p-4 border-t border-gray-700">
      <button @click="handleLogout"
        class="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-md">
        🚪 Cerrar sesión
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>