<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Usuarios</h1>
      <button
        @click="showModal = true"
        class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
      >
        + Nuevo Usuario
      </button>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Nombre</th>
            <th class="px-4 py-3">Email</th>
            <th class="px-4 py-3">Rol</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="border-t">
            <td class="px-4 py-3">{{ user.name }}</td>
            <td class="px-4 py-3">{{ user.email }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded text-xs font-medium"
                :class="{
                  'bg-purple-100 text-purple-700': user.role === 'SUPER_ADMIN',
                  'bg-blue-100 text-blue-700': user.role === 'STAFF',
                  'bg-green-100 text-green-700': user.role === 'STUDENT',
                }">
                {{ user.role }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :class="user.active ? 'text-green-600' : 'text-red-500'">
                {{ user.active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <button
                v-if="user.active"
                @click="handleDeactivate(user.id)"
                class="text-red-500 hover:underline text-xs"
              >
                Desactivar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal nuevo usuario -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">Nuevo Usuario</h2>
        <form @submit.prevent="handleCreate" class="space-y-3">
          <input v-model="form.name" placeholder="Nombre completo" required
            class="w-full border rounded px-3 py-2 text-sm" />
          <input v-model="form.email" type="email" placeholder="Email" required
            class="w-full border rounded px-3 py-2 text-sm" />
          <input v-model="form.password" type="password" placeholder="Contraseña" required
            class="w-full border rounded px-3 py-2 text-sm" />
          <select v-model="form.role" class="w-full border rounded px-3 py-2 text-sm">
            <option value="STUDENT">Estudiante</option>
            <option value="STAFF">Administrativo</option>
            <option value="SUPER_ADMIN">Administrador</option>
          </select>
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
import { getUsers, createUser, deactivateUser } from '../../api/users'

const users = ref<any[]>([])
const showModal = ref(false)
const formError = ref('')
const form = ref({ name: '', email: '', password: '', role: 'STUDENT' })

async function load() {
  const res = await getUsers()
  users.value = res.data
}

async function handleCreate() {
  formError.value = ''
  try {
    await createUser(form.value)
    closeModal()
    await load()
  } catch (e: any) {
    formError.value = e.response?.data?.message ?? 'Error al crear usuario'
  }
}

async function handleDeactivate(id: string) {
  if (!confirm('¿Desactivar este usuario?')) return
  await deactivateUser(id)
  await load()
}

function closeModal() {
  showModal.value = false
  form.value = { name: '', email: '', password: '', role: 'STUDENT' }
  formError.value = ''
}

onMounted(load)
</script>