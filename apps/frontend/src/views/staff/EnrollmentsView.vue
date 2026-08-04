<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Inscripciones</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Panel inscribir -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="font-semibold text-gray-700 mb-4">Inscribir estudiante</h2>

        <form @submit.prevent="handleEnroll" class="space-y-3">
          <div>
            <label class="text-xs text-gray-500">Curso</label>
            <select v-model="form.courseId" required class="w-full border rounded px-3 py-2 text-sm">
              <option value="">Seleccionar curso</option>
              <option v-for="c in activeCourses" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <!-- Toggle modo -->
          <div class="flex rounded overflow-hidden border text-sm">
            <button type="button" @click="mode = 'existing'"
              :class="['flex-1 py-2', mode === 'existing' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600']">
              Estudiante existente
            </button>
            <button type="button" @click="mode = 'new'"
              :class="['flex-1 py-2', mode === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600']">
              Estudiante nuevo
            </button>
          </div>

          <!-- Modo: existente -->
          <template v-if="mode === 'existing'">
            <div>
              <label class="text-xs text-gray-500">Buscar estudiante</label>
              <input v-model="studentSearch" placeholder="Buscar por nombre, apellido o CI..."
                class="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="text-xs text-gray-500">Estudiante</label>
              <select v-model="form.studentId" required class="w-full border rounded px-3 py-2 text-sm">
                <option value="">Seleccionar estudiante</option>
                <option v-for="u in filteredStudents" :key="u.id" :value="u.id">
                  {{ u.fullName }} {{ u.ci ? '— ' + u.ci : '' }}
                </option>
              </select>
              <p class="text-xs text-gray-400 mt-1">{{ filteredStudents.length }} estudiante(s)
                encontrados</p>
            </div>
          </template>

          <!-- Modo: nuevo -->
          <template v-else>
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2">
                <label class="text-xs text-gray-500">Nombres</label>
                <input v-model="newStudent.nombres" required class="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="text-xs text-gray-500">Apellido paterno</label>
                <input v-model="newStudent.apellidoPaterno" required class="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="text-xs text-gray-500">Apellido materno</label>
                <input v-model="newStudent.apellidoMaterno" class="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="text-xs text-gray-500">CI</label>
                <input v-model="newStudent.ci" class="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="text-xs text-gray-500">Celular</label>
                <input v-model="newStudent.celular" class="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div class="col-span-2">
                <label class="text-xs text-gray-500">Email</label>
                <input v-model="newStudent.email" type="email" required
                  class="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div class="col-span-2">
                <label class="text-xs text-gray-500">Contraseña</label>
                <div class="flex gap-2">
                  <input v-model="newStudent.password" required class="w-full border rounded px-3 py-2 text-sm" />
                  <button type="button" @click="generatePassword"
                    class="shrink-0 px-3 border rounded text-xs text-gray-600 hover:bg-gray-50">
                    Generar
                  </button>
                </div>
              </div>
            </div>
          </template>

          <p v-if="enrollError" class="text-red-500 text-xs">{{ enrollError }}</p>
          <p v-if="enrollSuccess" class="text-green-600 text-xs">{{ enrollSuccess }}</p>

          <button type="submit" :disabled="submitting"
            class="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
            {{ submitting ? 'Procesando...' : (mode === 'new' ? 'Registrar e inscribir' : 'Inscribir') }}
          </button>
        </form>
      </div>

      <!-- Panel inscripciones recientes -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="font-semibold text-gray-700 mb-4">Buscar inscripciones por curso</h2>
        <div class="space-y-3">
          <select v-model="viewCourseId" @change="loadCourseEnrollments"
            class="w-full border rounded px-3 py-2 text-sm">
            <option value="">Seleccionar curso</option>
            <option v-for="c in activeCourses" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <input v-model="enrollSearch" placeholder="Filtrar por nombre o CI..."
            class="w-full border rounded px-3 py-2 text-sm" />
        </div>

        <div class="mt-4 max-h-80 overflow-y-auto">
          <table v-if="filteredEnrollments.length > 0" class="w-full text-xs">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left">Estudiante</th>
                <th class="px-3 py-2 text-left">CI</th>
                <th class="px-3 py-2 text-left">Cert.</th>
                <th class="px-3 py-2 text-left">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in filteredEnrollments" :key="e.id" class="border-t">
                <td class="px-3 py-2">{{ e.studentName }}</td>
                <td class="px-3 py-2">{{ e.ci ?? '-' }}</td>
                <td class="px-3 py-2">
                  <span :class="e.certificateIssued ? 'text-green-600' : 'text-gray-400'">
                    {{ e.certificateIssued ? '✅' : '⏳' }}
                  </span>
                </td>
                <td class="px-3 py-2">
                  <button @click="handleUnenroll(e.id)" class="text-red-500 hover:underline">Quitar</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else-if="viewCourseId" class="text-center text-gray-400 text-sm py-4">
            No hay inscritos en este curso
          </p>
          <p v-else class="text-center text-gray-400 text-sm py-4">
            Selecciona un curso para ver sus inscritos
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getUsers, createUser } from '../../api/users'
import { getCourses } from '../../api/courses'
import { enrollStudent, getEnrollmentsByCourse, unenroll } from '../../api/enrollments'

const courses = ref<any[]>([])
const students = ref<any[]>([])
const courseEnrollments = ref<any[]>([])
const studentSearch = ref('')
const enrollSearch = ref('')
const viewCourseId = ref('')
const enrollError = ref('')
const enrollSuccess = ref('')
const submitting = ref(false)
const mode = ref<'existing' | 'new'>('existing')

const form = ref({ studentId: '', courseId: '' })

const newStudent = ref({
  nombres: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  ci: '',
  email: '',
  celular: '',
  password: '',
})

const activeCourses = computed(() => courses.value.filter(c => c.active))

const filteredStudents = computed(() => {
  const q = studentSearch.value.toLowerCase()
  if (!q) return students.value
  return students.value.filter(u =>
    u.fullName?.toLowerCase().includes(q) ||
    u.ci?.toLowerCase().includes(q)
  )
})

const filteredEnrollments = computed(() => {
  const q = enrollSearch.value.toLowerCase()
  if (!q) return courseEnrollments.value
  return courseEnrollments.value.filter(e =>
    e.studentName?.toLowerCase().includes(q) ||
    e.ci?.toLowerCase().includes(q)
  )
})

function generatePassword() {
  newStudent.value.password = Math.random().toString(36).slice(-8)
}

function resetNewStudentForm() {
  newStudent.value = {
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    ci: '',
    email: '',
    celular: '',
    password: '',
  }
}

async function loadCourseEnrollments() {
  if (!viewCourseId.value) return
  const res = await getEnrollmentsByCourse(viewCourseId.value)
  courseEnrollments.value = res.data
}

async function handleEnroll() {
  enrollError.value = ''
  enrollSuccess.value = ''
  submitting.value = true

  try {
    let studentId = form.value.studentId
    let studentLabel = ''

    if (mode.value === 'new') {
      // Paso 1: crear el estudiante
      let createdUser
      try {
        const res = await createUser({
          nombres: newStudent.value.nombres,
          apellidoPaterno: newStudent.value.apellidoPaterno,
          apellidoMaterno: newStudent.value.apellidoMaterno || undefined,
          ci: newStudent.value.ci || undefined,
          email: newStudent.value.email,
          celular: newStudent.value.celular || undefined,
          password: newStudent.value.password,
          role: 'STUDENT',
        })
        createdUser = res.data
      } catch (e: any) {
        const msg = e.response?.data?.message
        enrollError.value = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al registrar al estudiante')
        submitting.value = false
        return
      }

      studentId = createdUser.id
      studentLabel = createdUser.fullName ?? `${newStudent.value.nombres} ${newStudent.value.apellidoPaterno}`

      // lo agregamos en memoria para que quede disponible en la lista de "existentes"
      students.value.push(createdUser)
    } else {
      const student = students.value.find(u => u.id === studentId)
      studentLabel = student?.fullName ?? ''
    }

    // Paso 2: inscribir en el curso
    try {
      await enrollStudent(studentId, form.value.courseId)
    } catch (e: any) {
      if (mode.value === 'new') {
        enrollError.value = `El estudiante ${studentLabel} se registró correctamente, pero no se pudo inscribir en el curso. Búscalo como "existente" para inscribirlo manualmente. (${e.response?.data?.message ?? 'error de inscripción'})`
      } else {
        enrollError.value = e.response?.data?.message ?? 'Error al inscribir'
      }
      submitting.value = false
      return
    }

    const course = courses.value.find(c => c.id === form.value.courseId)
    enrollSuccess.value = `✅ ${studentLabel} inscrito en ${course?.name}`

    form.value.studentId = ''
    if (mode.value === 'new') {
      resetNewStudentForm()
      mode.value = 'existing'
    }

    if (viewCourseId.value === form.value.courseId) {
      await loadCourseEnrollments()
    }
  } finally {
    submitting.value = false
  }
}

async function handleUnenroll(id: string) {
  if (!confirm('¿Quitar esta inscripción?')) return
  await unenroll(id)
  await loadCourseEnrollments()
}

onMounted(async () => {
  const [coursesRes, usersRes] = await Promise.all([getCourses(), getUsers()])
  courses.value = coursesRes.data
  students.value = usersRes.data.filter((u: any) => u.role === 'STUDENT' && u.active)
})
</script>