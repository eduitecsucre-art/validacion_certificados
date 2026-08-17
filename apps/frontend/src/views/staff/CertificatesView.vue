<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Certificados</h1>
      <div class="flex gap-2">
        <button @click="openMassModal" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm">
          + Emisión Masiva
        </button>
        <button @click="openIndividualModal"
          class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
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
              <span class="px-2 py-0.5 rounded text-xs font-medium" :class="{
                'bg-green-100 text-green-700': cert.status === 'VALID',
                'bg-yellow-100 text-yellow-700': cert.status === 'EXPIRED',
                'bg-red-100 text-red-700': cert.status === 'REVOKED',
              }">
                {{ cert.status }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2 items-center flex-wrap">
                <button @click="openDetail(cert)" class="text-blue-500 hover:underline text-xs">
                  Ver
                </button>
                <button v-if="cert.status === 'VALID' && cert.pdfUrl" @click="handleDownload(cert)"
                  class="text-indigo-600 hover:underline text-xs">
                  Descargar
                </button>
                <button v-if="cert.status !== 'REVOKED'" @click="handleRevoke(cert)"
                  class="text-yellow-600 hover:underline text-xs">
                  Revocar
                </button>
                <button v-else @click="handleReactivate(cert)" class="text-green-600 hover:underline text-xs">
                  Reactivar
                </button>

                <button @click="handleDelete(cert)" class="text-red-600 hover:underline text-xs">
                  Eliminar
                </button>
              </div>
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
            <label class="text-xs text-gray-500">Curso</label>
            <select v-model="form.courseId" required @change="loadEnrolledStudents('individual')"
              class="w-full border rounded px-3 py-2 text-sm">
              <option value="">Seleccionar curso</option>
              <option v-for="c in activeCourses" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500">Estudiante inscrito</label>
            <select v-model="form.studentId" required :disabled="!form.courseId"
              class="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-50">
              <option value="">{{ form.courseId ? 'Seleccionar estudiante' : 'Primero selecciona un curso' }}</option>
              <option v-for="u in enrolledStudentsIndividual" :key="u.studentId" :value="u.studentId">
                {{ u.studentName }}
              </option>
            </select>
            <p v-if="form.courseId && enrolledStudentsIndividual.length === 0" class="text-xs text-yellow-600 mt-1">No
              hay estudiantes inscritos en este curso</p>
          </div>
          <div>
            <label class="text-xs text-gray-500">Instructor</label>
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
            <button type="button" @click="showModal = false"
              class="flex-1 border py-2 rounded text-sm hover:bg-gray-50">
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
            <select v-model="massForm.courseId" required @change="loadEnrolledStudents('mass')"
              class="w-full border rounded px-3 py-2 text-sm">
              <option value="">Seleccionar curso</option>
              <option v-for="c in activeCourses" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500">Instructor</label>
            <input v-model="massForm.instructor" required class="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="text-xs text-gray-500">Fecha inicio</label>
              <input v-model="massForm.startDate" type="date" required
                class="w-full border rounded px-3 py-2 text-sm" />
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
          <div v-if="massForm.courseId">
            <label class="text-xs text-gray-500">Estudiantes inscritos</label>
            <div class="border rounded p-2 max-h-40 overflow-y-auto space-y-1">
              <label v-for="u in enrolledStudentsMass" :key="u.studentId"
                class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" :value="u.studentId" v-model="massForm.studentIds" />
                {{ u.studentName }}
              </label>
              <p v-if="enrolledStudentsMass.length === 0" class="text-xs text-yellow-600 text-center py-2">
                No hay estudiantes inscritos en este curso
              </p>
            </div>
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span>{{ massForm.studentIds.length }} seleccionados</span>
              <button type="button" @click="selectAll" class="text-blue-500 hover:underline">
                {{ massForm.studentIds.length === enrolledStudentsMass.length ? 'Deseleccionar todos' : 'Seleccionar todos' }}
              </button>
            </div>
          </div>

          <p v-if="massError" class="text-red-500 text-xs">{{ massError }}</p>
          <p v-if="massSummary" class="text-xs font-medium"
            :class="massHasErrors ? 'text-yellow-700' : 'text-green-600'">
            {{ massSummary }}
          </p>

          <!-- Detalle por estudiante -->
          <div v-if="massResults.length > 0" class="border rounded p-2 max-h-40 overflow-y-auto space-y-1 text-xs">
            <div v-for="r in massResults" :key="r.studentId" class="flex justify-between items-center gap-2">
              <span class="truncate">{{ getMassStudentName(r.studentId) }}</span>
              <span :class="r.status === 'ok' ? 'text-green-600' : 'text-red-600'" class="shrink-0">
                {{ r.status === 'ok' ? '✅ ' + r.code : '❌ ' + r.message }}
              </span>
            </div>
          </div>
          <p v-if="massHasErrors" class="text-xs text-gray-400">
            Los estudiantes con error quedaron seleccionados para que puedas reintentar.
          </p>

          <div class="flex gap-2 pt-2">
            <button type="submit" :disabled="massLoading || massForm.studentIds.length === 0"
              class="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50">
              {{ massLoading ? 'Emitiendo...' : `Emitir para ${massForm.studentIds.length} estudiante(s)` }}
            </button>
            <button type="button" @click="showMassModal = false"
              class="flex-1 border py-2 rounded text-sm hover:bg-gray-50">
              Cerrar
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
            <span>{{ formatDate(selectedCert.startDate) }}{{ selectedCert.endDate ? ' - ' +
              formatDate(selectedCert.endDate) : '' }}</span>
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
            <span class="px-2 py-0.5 rounded text-xs font-medium" :class="{
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
import {
  getCertificates,
  createCertificate,
  createCertificatesMany,
  revokeCertificate,
  reactivateCertificate,
  deleteCertificatePermanent,
  downloadCertificate,
} from '../../api/certificates'
import { getUsers } from '../../api/users'
import { getCourses } from '../../api/courses'
import { getEnrollmentsByCourse } from '../../api/enrollments'

const certificates = ref<any[]>([])
const allUsers = ref<any[]>([])
const courses = ref<any[]>([])
const enrolledStudentsIndividual = ref<any[]>([])
const enrolledStudentsMass = ref<any[]>([])
const showModal = ref(false)
const showMassModal = ref(false)
const selectedCert = ref<any>(null)
const qrDataUrl = ref('')
const formError = ref('')
const massError = ref('')
const massSummary = ref('')
const massResults = ref<any[]>([])
const massLoading = ref(false)
const search = ref('')
const filterStatus = ref('')

const form = ref({ studentId: '', courseId: '', instructor: '', startDate: '', endDate: '', hours: 0 })
const massForm = ref({ courseId: '', instructor: '', startDate: '', endDate: '', hours: 0, studentIds: [] as string[] })

const activeCourses = computed(() => courses.value.filter(c => c.active))

const massHasErrors = computed(() => massResults.value.some(r => r.status === 'error'))

const filtered = computed(() => {
  return certificates.value.filter(c => {
    const q = search.value.toLowerCase()
    const matchSearch = !q || c.code.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q)
    const matchStatus = !filterStatus.value || c.status === filterStatus.value
    return matchSearch && matchStatus
  })
})

const downloadError = ref('')

async function handleDownload(cert: any) {
  downloadError.value = ''
  try {
    const res = await downloadCertificate(cert.id)
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
    // Como pedimos el blob como blob, si el backend devuelve un error JSON
    // (ej: "certificado EXPIRED"), llega como Blob también — hay que leerlo
    // como texto y parsearlo para mostrar el mensaje real, no [object Blob].
    if (e.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text()
        const parsed = JSON.parse(text)
        downloadError.value = parsed.message ?? 'Error al descargar el certificado'
      } catch {
        downloadError.value = 'Error al descargar el certificado'
      }
    } else {
      downloadError.value = e.response?.data?.message ?? 'Error al descargar el certificado'
    }
    alert(downloadError.value)
  }
}

function getStudentName(id: string) {
  const u = allUsers.value.find(u => u.id === id)
  if (!u) return id
  return `${u.apellidoPaterno} ${u.apellidoMaterno ?? ''} ${u.nombres}`.replace(/\s+/g, ' ').trim()
}

function getMassStudentName(id: string) {
  return enrolledStudentsMass.value.find(u => u.studentId === id)?.studentName ?? id
}

function getCourseName(id: string) {
  return courses.value.find(c => c.id === id)?.name ?? id
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES')
}

async function loadEnrolledStudents(mode: 'individual' | 'mass') {
  const courseId = mode === 'individual' ? form.value.courseId : massForm.value.courseId
  if (!courseId) return
  const res = await getEnrollmentsByCourse(courseId)
  if (mode === 'individual') {
    enrolledStudentsIndividual.value = res.data
    form.value.studentId = ''
    const course = courses.value.find(c => c.id === courseId)
    if (course) form.value.instructor = course.instructor
  } else {
    enrolledStudentsMass.value = res.data
    massForm.value.studentIds = []
    const course = courses.value.find(c => c.id === courseId)
    if (course) massForm.value.instructor = course.instructor
  }
}

function selectAll() {
  if (massForm.value.studentIds.length === enrolledStudentsMass.value.length) {
    massForm.value.studentIds = []
  } else {
    massForm.value.studentIds = enrolledStudentsMass.value.map(u => u.studentId)
  }
}

async function openDetail(cert: any) {
  selectedCert.value = cert
  const url = `${window.location.origin}/verificar/${cert.code}`
  qrDataUrl.value = await QRCode.toDataURL(url)
}

function openIndividualModal() {
  form.value = { studentId: '', courseId: '', instructor: '', startDate: '', endDate: '', hours: 0 }
  enrolledStudentsIndividual.value = []
  formError.value = ''
  showModal.value = true
}

function openMassModal() {
  massForm.value = { courseId: '', instructor: '', startDate: '', endDate: '', hours: 0, studentIds: [] }
  enrolledStudentsMass.value = []
  massError.value = ''
  massSummary.value = ''
  massResults.value = []
  showMassModal.value = true
}

async function load() {
  const [certsRes, usersRes, coursesRes] = await Promise.all([
    getCertificates(),
    getUsers(),
    getCourses(),
  ])
  certificates.value = certsRes.data
  allUsers.value = usersRes.data
  courses.value = coursesRes.data
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
  massSummary.value = ''
  massResults.value = []

  if (massForm.value.studentIds.length === 0) {
    massError.value = 'Selecciona al menos un estudiante'
    return
  }

  massLoading.value = true
  try {
    const res = await createCertificatesMany({
      studentIds: massForm.value.studentIds,
      courseId: massForm.value.courseId,
      instructor: massForm.value.instructor,
      startDate: massForm.value.startDate,
      endDate: massForm.value.endDate,
      hours: massForm.value.hours,
    })

    massResults.value = res.data
    const okCount = massResults.value.filter((r: any) => r.status === 'ok').length
    const errCount = massResults.value.length - okCount

    massSummary.value = errCount === 0
      ? `✅ ${okCount} certificado(s) emitido(s) correctamente`
      : `${okCount} emitido(s), ${errCount} con error`

    // Dejamos preseleccionados solo a los que fallaron, para reintentar fácil
    massForm.value.studentIds = massResults.value
      .filter((r: any) => r.status === 'error')
      .map((r: any) => r.studentId)

    await load()
  } catch (e: any) {
    massError.value = e.response?.data?.message ?? 'Error al emitir certificados'
  } finally {
    massLoading.value = false
  }
}

async function handleRevoke(cert: any) {
  if (!confirm(`¿Revocar el certificado ${cert.code}? Dejará de ser válido.`)) return
  try {
    await revokeCertificate(cert.id)
    await load()
  } catch (e: any) {
    alert(e.response?.data?.message ?? 'Error al revocar el certificado')
  }
}

async function handleReactivate(cert: any) {
  if (!confirm(`¿Reactivar el certificado ${cert.code}? Volverá a estar como VÁLIDO.`)) return
  try {
    await reactivateCertificate(cert.id)
    await load()
  } catch (e: any) {
    alert(e.response?.data?.message ?? 'Error al reactivar el certificado')
  }
}

async function handleDelete(cert: any) {
  if (!confirm(`⚠️ Esto eliminará PERMANENTEMENTE el certificado ${cert.code}. No se puede deshacer. ¿Continuar?`)) return
  if (!confirm('Confirma de nuevo: esta acción es irreversible.')) return
  try {
    await deleteCertificatePermanent(cert.id)
    await load()
  } catch (e: any) {
    alert(e.response?.data?.message ?? 'Error al eliminar el certificado')
  }
}

onMounted(load)
</script>