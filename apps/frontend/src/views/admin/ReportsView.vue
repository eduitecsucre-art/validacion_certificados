<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Informes</h1>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-lg shadow p-5">
        <p class="text-sm text-gray-500">Total Certificados</p>
        <p class="text-3xl font-bold text-blue-600 mt-1">{{ stats.total }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-5">
        <p class="text-sm text-gray-500">Válidos</p>
        <p class="text-3xl font-bold text-green-600 mt-1">{{ stats.valid }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-5">
        <p class="text-sm text-gray-500">Expirados</p>
        <p class="text-3xl font-bold text-yellow-600 mt-1">{{ stats.expired }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-5">
        <p class="text-sm text-gray-500">Revocados</p>
        <p class="text-3xl font-bold text-red-600 mt-1">{{ stats.revoked }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Por curso -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-semibold text-gray-800">Certificados por Curso</h2>
          <button @click="exportCSV" class="text-blue-600 hover:underline text-xs">Exportar CSV</button>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b">
              <th class="pb-2">Curso</th>
              <th class="pb-2">Total</th>
              <th class="pb-2">Válidos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in byCourse" :key="item.courseId" class="border-b last:border-0">
              <td class="py-2">{{ getCourseName(item.courseId) }}</td>
              <td class="py-2">{{ item.total }}</td>
              <td class="py-2 text-green-600">{{ item.valid }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Por estado -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="font-semibold text-gray-800 mb-4">Distribución por Estado</h2>
        <div class="space-y-3">
          <div v-for="item in byStatus" :key="item.status">
            <div class="flex justify-between text-sm mb-1">
              <span>{{ item.status }}</span>
              <span>{{ item.count }} ({{ item.percent }}%)</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="h-2 rounded-full"
                :class="{
                  'bg-green-500': item.status === 'VALID',
                  'bg-yellow-500': item.status === 'EXPIRED',
                  'bg-red-500': item.status === 'REVOKED',
                }"
                :style="{ width: item.percent + '%' }">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getCertificates } from '../../api/certificates'
import { getCourses } from '../../api/courses'

const certificates = ref<any[]>([])
const courses = ref<any[]>([])

const stats = computed(() => ({
  total: certificates.value.length,
  valid: certificates.value.filter(c => c.status === 'VALID').length,
  expired: certificates.value.filter(c => c.status === 'EXPIRED').length,
  revoked: certificates.value.filter(c => c.status === 'REVOKED').length,
}))

const byCourse = computed(() => {
  const map: Record<string, any> = {}
  for (const cert of certificates.value) {
    if (!map[cert.courseId]) map[cert.courseId] = { courseId: cert.courseId, total: 0, valid: 0 }
    map[cert.courseId].total++
    if (cert.status === 'VALID') map[cert.courseId].valid++
  }
  return Object.values(map)
})

const byStatus = computed(() => {
  const total = certificates.value.length || 1
  return ['VALID', 'EXPIRED', 'REVOKED'].map(status => ({
    status,
    count: certificates.value.filter(c => c.status === status).length,
    percent: Math.round((certificates.value.filter(c => c.status === status).length / total) * 100),
  }))
})

function getCourseName(id: string) {
  return courses.value.find(c => c.id === id)?.name ?? id
}

function exportCSV() {
  const rows = [['Curso', 'Total', 'Válidos', 'Expirados', 'Revocados']]
  for (const item of byCourse.value) {
    const expired = certificates.value.filter(c => c.courseId === item.courseId && c.status === 'EXPIRED').length
    const revoked = certificates.value.filter(c => c.courseId === item.courseId && c.status === 'REVOKED').length
    rows.push([getCourseName(item.courseId), item.total, item.valid, expired, revoked])
  }
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'informe_certificados.csv'
  a.click()
}

onMounted(async () => {
  const [certsRes, coursesRes] = await Promise.all([getCertificates(), getCourses()])
  certificates.value = certsRes.data
  courses.value = coursesRes.data
})
</script>