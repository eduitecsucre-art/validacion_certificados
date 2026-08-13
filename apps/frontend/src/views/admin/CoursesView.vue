<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Cursos</h1>
      <button @click="openCreate" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
        + Nuevo Curso
      </button>
    </div>

    <div class="bg-white rounded-lg shadow p-4 mb-4">
      <input v-model="search" placeholder="Buscar por nombre..."
        class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Nombre</th>
            <th class="px-4 py-3">Instructor</th>
            <th class="px-4 py-3">Horas</th>
            <th class="px-4 py-3">Vigencia</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in filtered" :key="course.id" class="border-t">
            <td class="px-4 py-3 font-medium">{{ course.name }}</td>
            <td class="px-4 py-3">{{ course.instructor }}</td>
            <td class="px-4 py-3">{{ course.hours }}h</td>
            <td class="px-4 py-3">{{ course.validityDays }} días</td>
            <td class="px-4 py-3">
              <span :class="course.active ? 'text-green-600' : 'text-red-500'">
                {{ course.active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3 flex gap-2">
              <button @click="openEdit(course)" class="text-blue-500 hover:underline text-xs">Editar</button>
              <button @click="openEnrollments(course)" class="text-green-500 hover:underline text-xs">Inscripciones</button>
              <router-link :to="`/cursos/${course.id}/plantilla`" class="text-purple-500 hover:underline text-xs">
                Plantilla
              </router-link>
              <button v-if="course.active" @click="handleDeactivate(course.id)"
                class="text-red-500 hover:underline text-xs">Desactivar</button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="6" class="px-4 py-6 text-center text-gray-400">No se encontraron cursos</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal crear/editar -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">{{ editing ? 'Editar Curso' : 'Nuevo Curso' }}</h2>
        <form @submit.prevent="handleSave" class="space-y-3">
          <div>
            <label class="text-xs text-gray-500">Nombre del curso</label>
            <input v-model="form.name" required class="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Instructor / Expositor</label>
            <input v-model="form.instructor" required class="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Descripción (opcional)</label>
            <textarea v-model="form.description" class="w-full border rounded px-3 py-2 text-sm" rows="2" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Horas académicas</label>
            <input v-model.number="form.hours" type="number" min="1" required
              class="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Vigencia en días (ej: 365 = 1 año)</label>
            <input v-model.number="form.validityDays" type="number" min="1" required
              class="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <p v-if="formError" class="text-red-500 text-xs">{{ formError }}</p>
          <div class="flex gap-2 pt-2">
            <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">
              {{ editing ? 'Guardar' : 'Crear' }}
            </button>
            <button type="button" @click="closeModal" class="flex-1 border py-2 rounded text-sm hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal inscripciones -->
    <div v-if="showEnrollModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 class="text-lg font-bold mb-1">Inscripciones</h2>
        <p class="text-sm text-gray-500 mb-4">{{ selectedCourse?.name }}</p>

        <!-- Inscribir estudiantes -->
        <div class="mb-4">
          <label class="text-xs text-gray-500 mb-1 block">Inscribir estudiantes</label>
          <div class="border rounded p-2 max-h-36 overflow-y-auto space-y-1">
            <label v-for="u in availableStudents" :key="u.id" class="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" :value="u.id" v-model="selectedStudents" />
              {{ u.name }} — {{ u.email }}
            </label>
            <p v-if="availableStudents.length === 0" class="text-xs text-gray-400 text-center py-2">
              Todos los estudiantes ya están inscritos
            </p>
          </div>
          <button @click="handleEnrollMany" :disabled="selectedStudents.length === 0"
            class="mt-2 w-full bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50">
            Inscribir {{ selectedStudents.length }} estudiante(s)
          </button>
        </div>

        <!-- Lista de inscritos -->
        <div>
          <p class="text-xs text-gray-500 mb-2 font-medium">Inscritos ({{ enrollments.length }})</p>
          <div class="max-h-40 overflow-y-auto border rounded">
            <table class="w-full text-xs">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left">Nombre</th>
                  <th class="px-3 py-2 text-left">Email</th>
                  <th class="px-3 py-2 text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in enrollments" :key="e.id" class="border-t">
                  <td class="px-3 py-2">{{ e.studentName }}</td>
                  <td class="px-3 py-2">{{ e.studentEmail }}</td>
                  <td class="px-3 py-2">
                    <button @click="handleUnenroll(e.id)" class="text-red-500 hover:underline">Quitar</button>
                  </td>
                </tr>
                <tr v-if="enrollments.length === 0">
                  <td colspan="3" class="px-3 py-4 text-center text-gray-400">Sin inscritos</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <button @click="showEnrollModal = false" class="mt-4 w-full border py-2 rounded text-sm hover:bg-gray-50">
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getCourses, createCourse, updateCourse, deactivateCourse } from '../../api/courses'
import { getUsers } from '../../api/users'
import { getEnrollmentsByCourse, enrollMany, unenroll } from '../../api/enrollments'

const courses = ref<any[]>([])
const allStudents = ref<any[]>([])
const enrollments = ref<any[]>([])
const showModal = ref(false)
const showEnrollModal = ref(false)
const editing = ref<any>(null)
const selectedCourse = ref<any>(null)
const selectedStudents = ref<string[]>([])
const formError = ref('')
const search = ref('')
const form = ref({ name: '', instructor: '', description: '', hours: 0, validityDays: 365 })

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return courses.value
  return courses.value.filter(c => c.name.toLowerCase().includes(q))
})

const availableStudents = computed(() => {
  const enrolledIds = enrollments.value.map(e => e.studentId)
  return allStudents.value.filter(u => !enrolledIds.includes(u.id))
})

async function load() {
  const [coursesRes, usersRes] = await Promise.all([getCourses(), getUsers()])
  courses.value = coursesRes.data
  allStudents.value = usersRes.data.filter((u: any) => u.role === 'STUDENT' && u.active)
}

async function openEnrollments(course: any) {
  selectedCourse.value = course
  selectedStudents.value = []
  const res = await getEnrollmentsByCourse(course.id)
  enrollments.value = res.data
  showEnrollModal.value = true
}

async function handleEnrollMany() {
  await enrollMany(selectedStudents.value, selectedCourse.value.id)
  selectedStudents.value = []
  const res = await getEnrollmentsByCourse(selectedCourse.value.id)
  enrollments.value = res.data
}

async function handleUnenroll(id: string) {
  if (!confirm('¿Quitar esta inscripción?')) return
  await unenroll(id)
  const res = await getEnrollmentsByCourse(selectedCourse.value.id)
  enrollments.value = res.data
}

function openCreate() {
  editing.value = null
  form.value = { name: '', instructor: '', description: '', hours: 0, validityDays: 365 }
  showModal.value = true
}

function openEdit(course: any) {
  editing.value = course
  form.value = {
    name: course.name,
    instructor: course.instructor,
    description: course.description ?? '',
    hours: course.hours,
    validityDays: course.validityDays,
  }
  showModal.value = true
}

async function handleSave() {
  formError.value = ''
  try {
    if (editing.value) {
      await updateCourse(editing.value.id, form.value)
    } else {
      await createCourse(form.value)
    }
    closeModal()
    await load()
  } catch (e: any) {
    formError.value = e.response?.data?.message ?? 'Error al guardar'
  }
}

async function handleDeactivate(id: string) {
  if (!confirm('¿Desactivar este curso?')) return
  await deactivateCourse(id)
  await load()
}

function closeModal() {
  showModal.value = false
  editing.value = null
  formError.value = ''
}

onMounted(load)
</script>