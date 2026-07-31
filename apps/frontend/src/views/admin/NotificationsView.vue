<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Historial de Notificaciones</h1>

    <div class="bg-white rounded-lg shadow p-4 mb-4">
      <input
        v-model="search"
        placeholder="Buscar por código de certificado..."
        class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Certificado</th>
            <th class="px-4 py-3">Tipo</th>
            <th class="px-4 py-3">Enviado</th>
            <th class="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in filtered" :key="n.id" class="border-t">
            <td class="px-4 py-3 font-mono text-xs">{{ n.certificateId }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                {{ n.type }}
              </span>
            </td>
            <td class="px-4 py-3">{{ n.sentAt ? formatDate(n.sentAt) : '-' }}</td>
            <td class="px-4 py-3">
              <span :class="n.sentAt ? 'text-green-600' : 'text-yellow-600'">
                {{ n.sentAt ? '✅ Enviado' : '⏳ Pendiente' }}
              </span>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="4" class="px-4 py-6 text-center text-gray-400">No hay notificaciones</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '../../api/index'

const notifications = ref<any[]>([])
const search = ref('')

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return notifications.value
  return notifications.value.filter(n => n.certificateId.toLowerCase().includes(q))
})

function formatDate(date: string) {
  return new Date(date).toLocaleString('es-ES')
}

onMounted(async () => {
  try {
    const res = await api.get('/notifications')
    notifications.value = res.data
  } catch {
    notifications.value = []
  }
})
</script>