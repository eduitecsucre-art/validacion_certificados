<template>
  <div class="min-h-screen bg-gray-50 flex items-start justify-center p-6">
    <div class="w-full max-w-2xl mt-12">
      <div class="text-center mb-6">
        <img src="/ITEC_LOGO.png" alt="Logo ITEC" class="h-20 mx-auto mb-4 object-contain" />
        <h1 class="text-2xl font-bold text-gray-800">Buscar mis certificados</h1>
        <p class="text-sm text-gray-500 mt-1">
          Ingresa tu número de Cédula de Identidad (CI) para ver y descargar tus certificados.
        </p>
      </div>

      <form @submit.prevent="handleSearch" class="bg-white rounded-lg shadow p-4 flex gap-2 mb-6">
        <input v-model="ci" placeholder="Ej: 1234567" required
          class="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" :disabled="loading"
          class="bg-blue-600 text-white px-5 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
          {{ loading ? 'Buscando...' : 'Buscar' }}
        </button>
      </form>

      <p v-if="error" class="text-red-500 text-sm text-center mb-4">{{ error }}</p>

      <div v-if="searched && !loading">
        <div v-if="results.length === 0" class="bg-white rounded-lg shadow p-8 text-center text-gray-400">
          No se encontraron certificados para ese CI.
        </div>

        <div v-else class="space-y-3">
          <div v-for="cert in results" :key="cert.id" class="bg-white rounded-lg shadow p-4 flex justify-between items-center">
            <div>
              <p class="font-medium text-gray-800">{{ cert.courseName }}</p>
              <p class="text-xs text-gray-500">
                {{ cert.code }} · {{ formatDate(cert.startDate) }} · {{ cert.hours }}h
              </p>
              <span class="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium"
                :class="{
                  'bg-green-100 text-green-700': cert.status === 'VALID',
                  'bg-yellow-100 text-yellow-700': cert.status === 'EXPIRED',
                  'bg-red-100 text-red-700': cert.status === 'REVOKED',
                }">
                {{ cert.status }}
              </span>
            </div>
            <button v-if="cert.hasPdf" @click="handleDownload(cert)"
              class="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs hover:bg-indigo-700 shrink-0">
              Descargar PDF
            </button>
            <span v-else class="text-xs text-gray-400 shrink-0">No disponible</span>
          </div>
        </div>
      </div>

      <div class="text-center mt-8">
        <router-link to="/login" class="text-sm text-blue-500 hover:underline">
          ← Volver al inicio de sesión
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { searchCertificatesByCI, downloadPublicCertificate } from '../../api/certificates'

const ci = ref('')
const results = ref<any[]>([])
const loading = ref(false)
const searched = ref(false)
const error = ref('')

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES')
}

async function handleSearch() {
  error.value = ''
  loading.value = true
  searched.value = false
  try {
    const res = await searchCertificatesByCI(ci.value.trim())
    results.value = res.data
    searched.value = true
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Error al buscar certificados'
  } finally {
    loading.value = false
  }
}

async function handleDownload(cert: any) {
  try {
    const res = await downloadPublicCertificate(cert.id)
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${cert.code}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e: any) {
    alert('No se pudo descargar el certificado. Es posible que ya no esté vigente.')
  }
}
</script>