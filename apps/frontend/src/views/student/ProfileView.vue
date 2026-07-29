<template>
  <div class="max-w-md">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h1>

    <div class="bg-white rounded-lg shadow p-6">
      <form @submit.prevent="handleUpdate" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input v-model="form.name" class="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input v-model="form.email" type="email" class="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña (opcional)</label>
          <input v-model="form.password" type="password" placeholder="Dejar en blanco para no cambiar"
            class="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <p v-if="success" class="text-green-600 text-sm">✅ Perfil actualizado</p>
        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
        <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">
          Guardar cambios
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { updateUser } from '../../api/users'

const auth = useAuthStore()
const success = ref(false)
const error = ref('')
const form = ref({ name: '', email: '', password: '' })

onMounted(() => {
  form.value.name = auth.user?.name ?? ''
  form.value.email = auth.user?.email ?? ''
})

async function handleUpdate() {
  success.value = false
  error.value = ''
  try {
    const data: any = { name: form.value.name, email: form.value.email }
    if (form.value.password) data.password = form.value.password
    await updateUser(auth.user.id, data)
    await auth.fetchMe()
    success.value = true
    form.value.password = ''
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Error al actualizar'
  }
}
</script>