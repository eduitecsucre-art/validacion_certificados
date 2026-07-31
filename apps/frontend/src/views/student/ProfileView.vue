<template>
  <div class="max-w-md">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h1>

    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="font-semibold text-gray-700 mb-4">Datos personales</h2>
      <form @submit.prevent="handleUpdate" class="space-y-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Nombre completo</label>
          <input v-model="form.name" required class="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Email</label>
          <input v-model="form.email" type="email" required class="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Rol</label>
          <input :value="auth.user?.role" disabled class="w-full border rounded px-3 py-2 text-sm bg-gray-50 text-gray-400" />
        </div>
        <p v-if="updateSuccess" class="text-green-600 text-sm">✅ Datos actualizados correctamente</p>
        <p v-if="updateError" class="text-red-500 text-sm">{{ updateError }}</p>
        <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">
          Guardar cambios
        </button>
      </form>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="font-semibold text-gray-700 mb-4">Cambiar contraseña</h2>
      <form @submit.prevent="handleChangePassword" class="space-y-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Nueva contraseña</label>
          <input v-model="passwords.new" type="password" required minlength="6"
            class="w-full border rounded px-3 py-2 text-sm" placeholder="Mínimo 6 caracteres" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Confirmar contraseña</label>
          <input v-model="passwords.confirm" type="password" required
            class="w-full border rounded px-3 py-2 text-sm" placeholder="Repite la contraseña" />
        </div>
        <p v-if="passwordSuccess" class="text-green-600 text-sm">✅ Contraseña actualizada correctamente</p>
        <p v-if="passwordError" class="text-red-500 text-sm">{{ passwordError }}</p>
        <button type="submit" class="w-full bg-gray-800 text-white py-2 rounded text-sm hover:bg-gray-900">
          Cambiar contraseña
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
const form = ref({ name: '', email: '' })
const passwords = ref({ new: '', confirm: '' })
const updateSuccess = ref(false)
const updateError = ref('')
const passwordSuccess = ref(false)
const passwordError = ref('')

onMounted(() => {
  form.value.name = auth.user?.name ?? ''
  form.value.email = auth.user?.email ?? ''
})

async function handleUpdate() {
  updateSuccess.value = false
  updateError.value = ''
  try {
    await updateUser(auth.user.id, { name: form.value.name, email: form.value.email })
    await auth.fetchMe()
    updateSuccess.value = true
  } catch (e: any) {
    updateError.value = e.response?.data?.message ?? 'Error al actualizar'
  }
}

async function handleChangePassword() {
  passwordSuccess.value = false
  passwordError.value = ''
  if (passwords.value.new !== passwords.value.confirm) {
    passwordError.value = 'Las contraseñas no coinciden'
    return
  }
  try {
    await updateUser(auth.user.id, { password: passwords.value.new })
    passwordSuccess.value = true
    passwords.value = { new: '', confirm: '' }
  } catch (e: any) {
    passwordError.value = e.response?.data?.message ?? 'Error al cambiar contraseña'
  }
}
</script>