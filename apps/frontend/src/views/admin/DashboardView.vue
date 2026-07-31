<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

    <!-- SUPER_ADMIN y STAFF -->
    <template v-if="auth.role !== 'STUDENT'">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-sm text-gray-500">Total Certificados</p>
          <p class="text-3xl font-bold text-blue-600 mt-1">{{ stats.total }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-sm text-gray-500">Certificados Válidos</p>
          <p class="text-3xl font-bold text-green-600 mt-1">{{ stats.valid }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-sm text-gray-500">Por Vencer (30 días)</p>
          <p class="text-3xl font-bold text-yellow-600 mt-1">{{ stats.expiring }}</p>
        </div>
      </div>

      <div v-if="expiring.length > 0" class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">⚠️ Certificados por vencer</h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b">
              <th class="pb-2">Estudiante</th>
              <th class="pb-2">Curso</th>
              <th class="pb-2">Vence</th>
              <th class="pb-2">Código</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cert in expiring" :key="cert.id" class="border-b last:border-0">
              <td class="py-2">{{ cert.studentId }}</td>
              <td class="py-2">{{ cert.courseId }}</td>
              <td class="py-2 text-yellow-600">{{ formatDate(cert.expiresAt) }}</td>
              <td class="py-2 font-mono text-xs">{{ cert.code }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        ✅ No hay certificados por vencer en los próximos 30 días
      </div>
    </template>

    <!-- STUDENT -->
    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-sm text-gray-500">Mis Certificados</p>
          <p class="text-3xl font-bold text-blue-600 mt-1">{{ studentStats.total }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-sm text-gray-500">Válidos</p>
          <p class="text-3xl font-bold text-green-600 mt-1">{{ studentStats.valid }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-sm text-gray-500">Por Vencer</p>
          <p class="text-3xl font-bold text-yellow-600 mt-1">{{ studentStats.expiring }}</p>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Mis últimos certificados</h2>
        <div v-if="myCertificates.length === 0" class="text-center text-gray-500 py-4">
          No tienes certificados aún.
        </div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b">
              <th class="pb-2">Curso</th>
              <th class="pb-2">Horas</th>
              <th class="pb-2">Vence</th>
              <th class="pb-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cert in myCertificates" :key="cert.id" class="border-b last:border-0">
              <td class="py-2">{{ cert.courseId }}</td>
              <td class="py-2">{{ cert.hours }}h</td>
              <td class="py-2">{{ formatDate(cert.expiresAt) }}</td>
              <td class="py-2">
                <span class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-700': cert.status === 'VALID',
                    'bg-yellow-100 text-yellow-700': cert.status === 'EXPIRED',
                    'bg-red-100 text-red-700': cert.status === 'REVOKED',
                  }">
                  {{ cert.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { getCertificates, getMyCertificates } from '../../api/certificates'

const auth = useAuthStore()
const certificates = ref<any[]>([])
const myCertificates = ref<any[]>([])

const stats = computed(() => {
  const total = certificates.value.length
  const valid = certificates.value.filter(c => c.status === 'VALID').length
  const now = new Date()
  const in30 = new Date()
  in30.setDate(now.getDate() + 30)
  const expiring = certificates.value.filter(c => {
    const exp = new Date(c.expiresAt)
    return c.status === 'VALID' && exp <= in30 && exp >= now
  }).length
  return { total, valid, expiring }
})

const studentStats = computed(() => {
  const total = myCertificates.value.length
  const valid = myCertificates.value.filter(c => c.status === 'VALID').length
  const now = new Date()
  const in30 = new Date()
  in30.setDate(now.getDate() + 30)
  const expiring = myCertificates.value.filter(c => {
    const exp = new Date(c.expiresAt)
    return c.status === 'VALID' && exp <= in30 && exp >= now
  }).length
  return { total, valid, expiring }
})

const expiring = computed(() => {
  const now = new Date()
  const in30 = new Date()
  in30.setDate(now.getDate() + 30)
  return certificates.value.filter(c => {
    const exp = new Date(c.expiresAt)
    return c.status === 'VALID' && exp <= in30 && exp >= now
  })
})

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES')
}

onMounted(async () => {
  if (auth.role === 'STUDENT') {
    const res = await getMyCertificates()
    myCertificates.value = res.data
  } else {
    try {
      const res = await getCertificates()
      certificates.value = res.data
    } catch {
      certificates.value = []
    }
  }
})
</script>