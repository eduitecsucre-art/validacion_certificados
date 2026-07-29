<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Mis Certificados</h1>

    <div v-if="certificates.length === 0" class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
      No tienes certificados aún.
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="cert in certificates" :key="cert.id"
        class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-start mb-3">
          <h3 class="font-semibold text-gray-800">{{ cert.courseId }}</h3>
          <span class="px-2 py-0.5 rounded text-xs font-medium"
            :class="{
              'bg-green-100 text-green-700': cert.status === 'VALID',
              'bg-yellow-100 text-yellow-700': cert.status === 'EXPIRED',
              'bg-red-100 text-red-700': cert.status === 'REVOKED',
            }">
            {{ cert.status }}
          </span>
        </div>
        <p class="text-sm text-gray-500">Instructor: {{ cert.instructor }}</p>
        <p class="text-sm text-gray-500">Horas: {{ cert.hours }}h</p>
        <p class="text-sm text-gray-500">Vence: {{ formatDate(cert.expiresAt) }}</p>
        <p class="text-xs font-mono text-gray-400 mt-2">{{ cert.code }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMyCertificates } from '../../api/certificates'

const certificates = ref<any[]>([])

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES')
}

onMounted(async () => {
  const res = await getMyCertificates()
  certificates.value = res.data
})
</script>