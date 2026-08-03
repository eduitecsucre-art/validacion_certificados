<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Mis Cursos y Certificados</h1>

    <!-- Cursos inscritos -->
    <div class="mb-8">
      <h2 class="text-lg font-semibold text-gray-700 mb-4">Cursos inscritos</h2>
      <div v-if="enrollments.length === 0" class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No estás inscrito en ningún curso aún.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="e in enrollments" :key="e.id" class="bg-white rounded-lg shadow p-5">
          <h3 class="font-semibold text-gray-800 mb-1">{{ e.courseName }}</h3>
          <p class="text-sm text-gray-500">Instructor: {{ e.courseInstructor }}</p>
          <p class="text-sm text-gray-500">Horas: {{ e.courseHours }}h</p>
          <p class="text-xs text-gray-400 mt-1">Inscrito: {{ formatDate(e.enrolledAt) }}</p>
        </div>
      </div>
    </div>

    <!-- Certificados obtenidos -->
    <div>
      <h2 class="text-lg font-semibold text-gray-700 mb-4">Certificados obtenidos</h2>
      <div v-if="certificates.length === 0" class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No tienes certificados aún.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="cert in certificates" :key="cert.id" class="bg-white rounded-lg shadow p-5">
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
          <div class="mt-3 flex gap-2">
            <button @click="openQR(cert)"
              class="flex-1 border border-blue-500 text-blue-600 py-1.5 rounded text-xs hover:bg-blue-50">
              Ver QR
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal QR -->
    <div v-if="selectedCert" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-sm text-center">
        <h2 class="text-lg font-bold mb-1">{{ selectedCert.code }}</h2>
        <p class="text-sm text-gray-500 mb-4">Escanea para verificar</p>
        <img :src="qrDataUrl" class="mx-auto w-48 h-48 mb-4" />
        <p class="text-xs text-gray-400 mb-4">{{ verifyUrl }}</p>
        <button @click="selectedCert = null" class="w-full border py-2 rounded text-sm hover:bg-gray-50">
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import QRCode from 'qrcode'
import { useAuthStore } from '../../stores/auth'
import { getMyCertificates } from '../../api/certificates'
import { getEnrollmentsByStudent } from '../../api/enrollments'

const auth = useAuthStore()
const certificates = ref<any[]>([])
const enrollments = ref<any[]>([])
const selectedCert = ref<any>(null)
const qrDataUrl = ref('')

const verifyUrl = computed(() =>
  selectedCert.value ? `${window.location.origin}/verificar/${selectedCert.value.code}` : ''
)

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES')
}

async function openQR(cert: any) {
  selectedCert.value = cert
  const url = `${window.location.origin}/verificar/${cert.code}`
  qrDataUrl.value = await QRCode.toDataURL(url)
}

onMounted(async () => {
  const [certsRes, enrollRes] = await Promise.all([
    getMyCertificates(),
    getEnrollmentsByStudent(auth.user.id),
  ])
  certificates.value = certsRes.data
  enrollments.value = enrollRes.data
})
</script>