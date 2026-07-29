<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Cursos</h1>
      <button @click="showModal = true" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
        + Nuevo Curso
      </button>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Nombre</th>
            <th class="px-4 py-3">Horas</th>
            <th class="px-4 py-3">Vigencia</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in courses" :key="course.id" class="border-t">
            <td class="px-4 py-3">{{ course.name }}</td>
            <td class="px-4 py-3">{{ course.hours }}h</td>
            <td class="px-4 py-3">{{ course.validityDays }} días</td>
            <td class="px-4 py-3">
              <span :class="course.active ? 'text-green-600' : 'text-red-500'">
                {{ course.active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <button v-if="course.active" @click="handleDeactivate(course.id)"
                class="text-red-500 hover:underline text-xs">
                Desactivar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">Nuevo Curso</h2>
        <form @submit.prevent="handleCreate" class="space-y-3">
          <input v-model="form.name" placeholder="Nombre del curso" required
            class="w-full border rounded px-3 py-2 text-sm" />
          <textarea v-model="form.description" placeholder="Descripción (opcional)"
            class="w-full border rounded px-3 py-2 text-sm" rows="2" />
          <input v-model.number="form.hours" type="number" placeholder="Horas académicas" required
            class="w-full border rounded px-3 py-2 text-sm" />
          <input v-model.number="form.validityDays" type="number" placeholder="Vigencia en días (ej: 365)" required
            class="w-full border rounded px-3 py-2 text-sm" />
          <p v-if="formError" class="text-red-500 text-xs">{{ formError }}</p>
          <div class="flex gap-2 pt-2">
            <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">
              Crear
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
import { getCourses, createCourse, deactivateCourse } from '../../api/courses'

const courses = ref<any[]>([])
const showModal = ref(false)
const formError = ref('')
const form = ref({ name: '', description: '', hours: 0, validityDays: 365 })

async function load() {
  const res = await getCourses()
  courses.value = res.data
}

async function handleCreate() {
  formError.value = ''
  try {
    await createCourse(form.value)
    closeModal()
    await load()
  } catch (e: any) {
    formError.value = e.response?.data?.message ?? 'Error al crear curso'
  }
}

async function handleDeactivate(id: string) {
  if (!confirm('¿Desactivar este curso?')) return
  await deactivateCourse(id)
  await load()
}

function closeModal() {
  showModal.value = false
  form.value = { name: '', description: '', hours: 0, validityDays: 365 }
  formError.value = ''
}

onMounted(load)
</script>