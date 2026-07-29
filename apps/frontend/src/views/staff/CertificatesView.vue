<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Certificados</h1>
      <button @click="showModal = true" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
        + Emitir Certificado
      </button>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Código</th>
            <th class="px-4 py-3">Estudiante</th>
            <th class="px-4 py-3">Curso</th>
            <th class="px-4 py-3">Fecha</th>
            <th class="px-4 py-3">Vence</th>
            <th class="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cert in certificates" :key="cert.id" class="border-t">
            <td class="px-4 py-3 font-mono text-xs">{{ cert.code }}</td>
            <td class="px-4 py-3">{{ cert.studentId }}</td>
            <td class="px-4 py-3">{{ cert.courseId }}</td>
            <td class="px-4 py-3">{{ formatDate(cert.startDate) }}</td>
            <td class="px-4 py-3">{{ formatDate(cert.expiresAt) }}</td>
            <td class="px-4 py-3">
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

    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">Emitir Certificado</h2>
        <form @submit.prevent="handleCreate" class="space-y-3">
          <select v-model="form.studentId" required class="w-full border rounded px-3 py-2 text-sm">
            <option value="">Seleccionar estudiante</option>
            <option v-for="u in students" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
          <select v-model="form.courseId" required class="w-full border rounded px-3 py-2 text-sm">
            <option value="">Seleccionar curso</option>
            <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <input v-model="form.instructor" placeholder="Instructor / Expositor" required
            class="w-full border rounded px-3 py-2 text-sm" />
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="text-xs text-gray-500">Fecha inicio</label>
              <input v-model="form.startDate" type="date" required class="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div class="flex-1">
              <label class="text-xs text-gray-500">Fecha fin (opcional)</label>
              <input v-model="form.endDate" type="date" class="w-full border rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <input v-model.number="form.hours" type="number" placeholder="Horas académicas" required
            class="w-full border rounded px-3 py-2 text-sm" />
          <p v-if="formError" class="text-red-500 text-xs">{{ formError }}</p>
          <div class="flex gap-2 pt-2">
            <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">
              Emitir
            </button>
            <button type="button" @click="closeModal" class="flex-1 border py-2 rounded text-sm hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCertificates, createCertificate } from '../../api/certificates'
import { getUsers } from '../../api/users'
import { getCourses } from '../../api/courses'

const certificates = ref<any[]>([])
const students = ref<any[]>([])
const courses = ref<any[]>([])
const showModal = ref(false)
const formError = ref('')
const form = ref({
  studentId: '',
  courseId: '',
  instructor: '',
  startDate: '',
  endDate: '',
  hours: 0,
})

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES')
}

async function load() {
  const [certsRes, usersRes, coursesRes] = await Promise.all([
    getCertificates(),
    getUsers(),
    getCourses(),
  ])
  certificates.value = certsRes.data
  students.value = usersRes.data.filter((u: any) => u.role === 'STUDENT')
  courses.value = coursesRes.data.filter((c: any) => c.active)
}

async function handleCreate() {
  formError.value = ''
  try {
    await createCertificate(form.value)
    closeModal()
    await load()
  } catch (e: any) {
    formError.value = e.response?.data?.message ?? 'Error al emitir certificado'
  }
}

function closeModal() {
  showModal.value = false
  form.value = { studentId: '', courseId: '', instructor: '', startDate: '', endDate: '', hours: 0 }
  formError.value = ''
}

onMounted(load)
</script>