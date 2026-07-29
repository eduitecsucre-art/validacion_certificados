<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-lg w-full max-w-lg p-8">

      <div v-if="loading" class="text-center text-gray-500">
        Verificando certificado...
      </div>

      <div v-else-if="error" class="text-center">
        <p class="text-5xl mb-4">❌</p>
        <h2 class="text-xl font-bold text-red-600">Certificado no encontrado</h2>
        <p class="text-gray-500 mt-2">El código ingresado no corresponde a ningún certificado válido.</p>
      </div>

      <div v-else-if="cert">
        <div class="text-center mb-6">
          <p class="text-5xl mb-2">
            {{ cert.status === 'VALID' ? '✅' : cert.status === 'EXPIRED' ? '⚠️' : '❌' }}
          </p>
          <span
            class="px-4 py-1 rounded-full text-sm font-semibold"
            :class="{
              'bg-green-100 text-green-700': cert.status === 'VALID',
              'bg-yellow-100 text-yellow-700': cert.status === 'EXPIRED',
              'bg-red-100 text-red-700': cert.status === 'REVOKED',
            }"
          >
            {{ cert.status === 'VALID' ? 'CERTIFICADO VÁLIDO' : cert.status === 'EXPIRED' ? 'CERTIFICADO EXPIRADO' : 'CERTIFICADO REVOCADO' }}
          </span>
        </div>

        <div class="space-y-3 text-sm">
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-500">Estudiante</span>
            <span class="font-semibold">{{ cert.studentName }}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-500">Curso</span>
            <span class="font-semibold">{{ cert.courseName }}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-500">Instructor</span>
            <span class="font-semibold">{{ cert.instructor }}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-500">Fecha</span>
            <span class="font-semibold">{{ formatDate(cert.startDate) }}{{ cert.endDate ? ' - ' + formatDate(cert.endDate) : '' }}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-500">Horas académicas</span>
            <span class="font-semibold">{{ cert.hours }}h</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-500">Válido hasta</span>
            <span class="font-semibold">{{ formatDate(cert.expiresAt) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Código</span>
            <span class="font-mono text-xs">{{ cert.code }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { verifyCertificate } from '../../api/certificates'

const route = useRoute()
const cert = ref<any>(null)
const loading = ref(true)
const error = ref(false)

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES')
}

onMounted(async () => {
  try {
    const res = await verifyCertificate(route.params.code as string)
    cert.value = res.data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>