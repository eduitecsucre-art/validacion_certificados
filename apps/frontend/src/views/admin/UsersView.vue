<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Usuarios</h1>
      <button @click="openCreate" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
        + Nuevo Usuario
      </button>
    </div>

    <!-- Buscador -->
    <div class="bg-white rounded-lg shadow p-4 mb-4">
      <input
        v-model="search"
        placeholder="Buscar por nombre, email o rol..."
        class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
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
          <tr v-for="user in filtered" :key="user.id" class="border-t">
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
            <td class="px-4 py-3 flex gap-2">
              <button @click="openEdit(user)" class="text-blue-500 hover:underline text-xs">Editar</button>
              <button v-if="user.active" @click="handleDeactivate(user.id)"
                class="text-red-500 hover:underline text-xs">Desactivar</button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="5" class="px-4 py-6 text-center text-gray-400">No se encontraron usuarios</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal crear/editar -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-lg font-bold mb-4">{{ editing ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
        <form @submit.prevent="handleSave" class="space-y-3">
          <div>
            <label class="text-xs text-gray-500">Nombre completo</label>
            <input v-model="form.name" required class="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Email</label>
            <input v-model="form.email" type="email" required class="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs text-gray-500">{{ editing ? 'Nueva contraseña (dejar en blanco para no cambiar)' : 'Contraseña' }}</label>
            <input v-model="form.password" type="password" :required="!editing" class="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs text-gray-500">Rol</label>
            <select v-model="form.role" class="w-full border rounded px-3 py-2 text-sm">
              <option value="STUDENT">Estudiante</option>
              <option value="STAFF">Administrativo</option>
              <option value="SUPER_ADMIN">Administrador</option>
            </select>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getUsers, createUser, updateUser, deactivateUser } from '../../api/users'

const users = ref<any[]>([])
const showModal = ref(false)
const editing = ref<any>(null)
const formError = ref('')
const search = ref('')
const form = ref({ name: '', email: '', password: '', role: 'STUDENT' })

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    u.role.toLowerCase().includes(q)
  )
})

async function load() {
  const res = await getUsers()
  users.value = res.data
}

function openCreate() {
  editing.value = null
  form.value = { name: '', email: '', password: '', role: 'STUDENT' }
  showModal.value = true
}

function openEdit(user: any) {
  editing.value = user
  form.value = { name: user.name, email: user.email, password: '', role: user.role }
  showModal.value = true
}

async function handleSave() {
  formError.value = ''
  try {
    if (editing.value) {
      const data: any = { name: form.value.name, email: form.value.email, role: form.value.role }
      if (form.value.password) data.password = form.value.password
      await updateUser(editing.value.id, data)
    } else {
      await createUser(form.value)
    }
    closeModal()
    await load()
  } catch (e: any) {
    formError.value = e.response?.data?.message ?? 'Error al guardar'
  }
}

async function handleDeactivate(id: string) {
  if (!confirm('¿Desactivar este usuario?')) return
  await deactivateUser(id)
  await load()
}

function closeModal() {
  showModal.value = false
  editing.value = null
  formError.value = ''
}

onMounted(load)
</script>