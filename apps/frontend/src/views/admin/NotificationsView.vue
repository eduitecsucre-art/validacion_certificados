<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Historial de Notificaciones</h1>

    <div class="bg-white rounded-lg shadow p-4 mb-4">
      <input
        v-model="search"
        placeholder="Buscar por código, estudiante o curso..."
        class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <p v-if="resendMessage" class="text-sm mb-4" :class="resendError ? 'text-red-500' : 'text-green-600'">
      {{ resendMessage }}
    </p>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Certificado</th>
            <th class="px-4 py-3">Estudiante</th>
            <th class="px-4 py-3">Curso</th>
            <th class="px-4 py-3">Tipo</th>
            <th class="px-4 py-3">Enviado</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in filtered" :key="n.id" class="border-t">
            <td class="px-4 py-3 font-mono text-xs">{{ n.certificateCode ?? n.certificateId }}</td>
            <td class="px-4 py-3">
              <div>{{ n.studentName ?? '—' }}</div>
              <div class="text-xs text-gray-400">{{ n.studentEmail ?? '' }}</div>
            </td>
            <td class="px-4 py-3">{{ n.courseName ?? '—' }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                {{ typeLabel(n.type) }}
              </span>
            </td>
            <td class="px-4 py-3">{{ n.sentAt ? formatDate(n.sentAt) : '-' }}</td>
            <td class="px-4 py-3">
              <span :class="n.sentAt ? 'text-green-600' : 'text-red-500'">
                {{ n.sentAt ? '✅ Enviado' : '❌ Falló' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <button v-if="n.type === 'CERTIFICATE_ISSUED'"
                @click="handleResend(n)"
                :disabled="resendingId === n.certificateId"
                class="text-blue-500 hover:underline text-xs disabled:opacity-50">
                {{ resendingId === n.certificateId ? 'Enviando...' : 'Reenviar' }}
              </button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="7" class="px-4 py-6 text-center text-gray-400">No hay notificaciones</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '../../api/index'
import { resendCertificateEmail } from '../../api/certificates'

const notifications = ref<any[]>([])
const search = ref('')
const resendingId = ref<string | null>(null)
const resendMessage = ref('')
const resendError = ref(false)

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return notifications.value
  return notifications.value.filter(n =>
    n.certificateCode?.toLowerCase().includes(q) ||
    n.studentName?.toLowerCase().includes(q) ||
    n.courseName?.toLowerCase().includes(q)
  )
})

function typeLabel(type: string) {
  if (type === 'CERTIFICATE_ISSUED') return 'Certificado emitido'
  if (type === 'EXPIRATION_WARNING') return 'Aviso de vencimiento'
  return type
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('es-ES')
}

async function load() {
  try {
    const res = await api.get('/notifications')
    notifications.value = res.data
  } catch {
    notifications.value = []
  }
}

async function handleResend(n: any) {
  resendMessage.value = ''
  resendError.value = false
  resendingId.value = n.certificateId
  try {
    await resendCertificateEmail(n.certificateId)
    resendMessage.value = `✅ Correo reenviado a ${n.studentEmail ?? 'el estudiante'}`
    await load()
  } catch (e: any) {
    resendError.value = true
    resendMessage.value = e.response?.data?.message ?? 'Error al reenviar el correo'
  } finally {
    resendingId.value = null
  }
}

onMounted(load)
</script>