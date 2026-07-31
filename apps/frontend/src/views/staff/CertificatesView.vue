<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Certificados</h1>
      <div class="flex gap-2">
        <button @click="showMassModal = true" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm">
          + Emisión Masiva
        </button>
        <button @click="showModal = true" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
          + Emitir Individual
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-lg shadow p-4 mb-4 flex gap-3 flex-wrap">
      <input v-model="search" placeholder="Buscar por código o instructor..."
        class="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <select v-model="filterStatus" class="border rounded px-3 py-2 text-sm">
        <option value="">Todos los estados</option>
        <option value="VALID">Válido</option>
        <option value="EXPIRED">Expirado</option>
        <option value="REVOKED">Revocado</option>
      </select>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Código</th>
            <th class="px-4 py-3">Estudiante</th>
            <th class="px-4 py-3">Curso</th>
            <th class="px-4 py-3">Instructor</th>
            <th class="px-4 py-3">Fecha</th>
            <th class="px-4 py-3">Vence</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cert in filtered" :key="cert.id" class="border-t">
            <td class="px-4 py-3 font-mono text-xs">{{ cert.code }}</td>
            <td class="px-4 py-3">{{ getStudentName(cert.studentId) }}</td>
            <td class="px-4 py-3">{{ getCourseName(cert.courseId) }}</td>
            <td class="px-4 py-3">{{ cert.instructor }}</td>
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
            <td class="px-4 py-3">
              <button @click="openDetail(cert)" class="text-blue-500 hover:underline text-xs">Ver</button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="8" class="px-4 py-6 text-center text-gray-400">No se encontraron certificados</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal emitir individual -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">Emitir Certificado Individual</h2>
        <form @submit.prevent="handleCreate" class="space-y-3">
          <div>
            <label class="text-xs text-gray-500">Estudiante</label>
            <select v-model="form.studentId" required class="w-full border rounded px-3 py-2 text-sm">
              <option value="">Seleccionar estudiante</option>
              <option v-for="u in students" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500">Curso</label>
            <select v-model="form.courseId" required class="w-full border rounded px-3 py-2 text-sm">
              <option value="">Seleccionar curso</option>
              <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500">Instructor / Expositor</label>
            <input v-model="form.instructor" required class="w-full border rounded px-3 py-2 text-sm" />
          </div>
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
          <div>
            <label class="text-xs text-gray-500">Horas académicas</label>
            <input v-model.number="form.hours" type="number" min="1" required
              class="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <p v-if="formError" class="text-red-500 text-xs">{{ formError }}</p>
          <div class="flex gap-2 pt-2">
            <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">
              Emitir
            </button>
            <button type="button" @click="showModal = false" class="flex-1 border py-2 rounded text-sm hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal emisión masiva -->
    <div v-if="showMassModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">Emisión Masiva por Curso</h2>
        <form @submit.prevent="handleMassCreate" class="space-y-3">
          <div>
            <label class="text-xs text-gray-500">Curso</label>
            <select v-model="massForm.courseId" required class="w-full border rounded px-3 py-2 text-sm">
              <option value="">Seleccionar curso</option>
              <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500">Instructor / Expositor</label>
            <input v-model="massForm.instructor" required class="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="text-xs text-gray-500">Fecha inicio</label>
              <input v-model="massForm.startDate" type="date" required class="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div class="flex-1">
              <label class="text-xs text-gray-500">Fecha fin (opcional)</label>
              <input v-model="massForm.endDate" type="date" class="w-full border rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label class="text-xs text-gray-500">Horas académicas</label>
            <input v-model.number="massForm.hours" type="number" min="1" required
              class="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Estudiantes</label>
            <div class="border rounded p-2 max-h-40 overflow-y-auto space-y-1">
              <label v-for="u in students" :key="u.id" class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" :value="u.id" v-model="massForm.studentIds" />
                {{ u.name }}
              </label>
            </div>
            <p class="text-xs text-gray-400 mt-1">{{ massForm.studentIds.length }} estudiante(s) seleccionados</p>
          </div>
          <p v-if="massError" class="text-red-500 text-xs">{{ massError }}</p>
          <p v-if="massSuccess" class="text-green-600 text-xs">{{ massSuccess }}</p>
          <div class="flex gap-2 pt-2">
            <button type="submit" :disabled="massLoading"
              class="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50">
              {{ massLoading ? 'Emitiendo...' : 'Emitir para todos' }}
            </button>
            <button type="button" @click="showMassModal = false"
              class="flex-1 border py-2 rounded text-sm hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal detalle certificado -->
    <div v-if="selectedCert" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">Detalle del Certificado</h2>
        <div class="space-y-2 text-sm mb-4">
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-500">Código</span>
            <span class="font-mono text-xs">{{ selectedCert.code }}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-500">Estudiante</span>
            <span>{{ getStudentName(selectedCert.studentId) }}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-500">Curso</span>
            <span>{{ getCourseName(selectedCert.courseId) }}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-500">Instructor</span>
            <span>{{ selectedCert.instructor }}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-500">Fecha</span>
            <span>{{ formatDate(selectedCert.startDate) }}{{ selectedCert.endDate ? ' - ' + formatDate(selectedCert.endDate) : '' }}</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-500">Horas</span>
            <span>{{ selectedCert.hours }}h</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-500">Vence</span>
            <span>{{ formatDate(selectedCert.expiresAt) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Estado</span>
            <span class="px-2 py-0.5 rounded text-xs font-medium"
              :class="{
                'bg-green-100 text-green-700': selectedCert.status === 'VALID',
                'bg-yellow-100 text-yellow-700': selectedCert.status === 'EXPIRED',
                'bg-red-100 text-red-700': selectedCert.status === 'REVOKED',
              }">
              {{ selectedCert.status }}
            </span>
          </div>
        </div>
        <div class="text-center mb-4">
          <p class="text-xs text-gray-500 mb-2">QR de verificación</p>
          <img :src="qrDataUrl" class="mx-auto w-40 h-40" />
          <p class="text-xs text-gray-400 mt-1">Escanear para verificar</p>
        </div>
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
import { getCertificates, createCertificate } from '../../api/certificates'
import { getUsers } from '../../api/users'
import { getCourses } from '../../api/courses'

const certificates = ref<any[]>([])
const students = ref<any[]>([])
const courses = ref<any[]>([])
const showModal = ref(false)
const showMassModal = ref(false)
const selectedCert = ref<any>(null)
const qrDataUrl = ref('')
const formError = ref('')
const massError = ref('')
const massSuccess = ref('')
const massLoading = ref(false)
const search = ref('')
const filterStatus = ref('')

const form = ref({ studentId: '', courseId: '', instructor: '', startDate: '', endDate: '', hours: 0 })
const massForm = ref({ courseId: '', instructor: '', startDate: '', endDate: '', hours: 0, studentIds: [] as string[] })

const filtered = computed(() => {
  return certificates.value.filter(c => {
    const q = search.value.toLowerCase()
    const matchSearch = !q || c.code.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q)
    const matchStatus = !filterStatus.value || c.status === filterStatus.value
    return matchSearch && matchStatus
  })
})

function getStudentName(id: string) {
  return students.value.find(u => u.id === id)?.name ?? id
}

function getCourseName(id: string) {
  return courses.value.find(c => c.id === id)?.name ?? id
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES')
}

async function openDetail(cert: any) {
  selectedCert.value = cert
  const url = `${window.location.origin}/verificar/${cert.code}`
  qrDataUrl.value = await QRCode.toDataURL(url)
}

async function load() {
  const [certsRes, usersRes, coursesRes] = await Promise.all([
    getCertificates(),
    getUsers(),
    getCourses(),
  ])
  certificates.value = certsRes.data
  students.value = usersRes.data.filter((u: any) => u.role === 'STUDENT' && u.active)
  courses.value = coursesRes.data.filter((c: any) => c.active)
}

async function handleCreate() {
  formError.value = ''
  try {
    await createCertificate(form.value)
    showModal.value = false
    form.value = { studentId: '', courseId: '', instructor: '', startDate: '', endDate: '', hours: 0 }
    await load()
  } catch (e: any) {
    formError.value = e.response?.data?.message ?? 'Error al emitir certificado'
  }
}

async function handleMassCreate() {
  massError.value = ''
  massSuccess.value = ''
  if (massForm.value.studentIds.length === 0) {
    massError.value = 'Selecciona al menos un estudiante'
    return
  }
  massLoading.value = true
  try {
    for (const studentId of massForm.value.studentIds) {
      await createCertificate({
        studentId,
        courseId: massForm.value.courseId,
        instructor: massForm.value.instructor,
        startDate: massForm.value.startDate,
        endDate: massForm.value.endDate,
        hours: massForm.value.hours,
      })
    }
    massSuccess.value = `✅ ${massForm.value.studentIds.length} certificados emitidos correctamente`
    massForm.value = { courseId: '', instructor: '', startDate: '', endDate: '', hours: 0, studentIds: [] }
    await load()
  } catch (e: any) {
    massError.value = e.response?.data?.message ?? 'Error al emitir certificados'
  } finally {
    massLoading.value = false
  }
}

onMounted(load)
</script>