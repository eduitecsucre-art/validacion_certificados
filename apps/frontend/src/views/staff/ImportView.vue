<template>
    <div class="max-w-2xl">
        <h1 class="text-2xl font-bold text-gray-800 mb-6">Importar Estudiantes desde CSV</h1>

        <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h2 class="font-semibold text-gray-700 mb-3">Formato del archivo CSV</h2>
            <p class="text-sm text-gray-500 mb-2">El archivo debe tener las siguientes columnas en orden:</p>
            <div class="bg-gray-50 rounded p-3 font-mono text-xs text-gray-600">
                nombre,email,password
            </div>
            <p class="text-xs text-gray-400 mt-2">Ejemplo: Juan Pérez,juan@email.com,contraseña123</p>
            <button @click="downloadTemplate" class="mt-3 text-blue-600 hover:underline text-sm">
                Descargar plantilla CSV
            </button>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                @click="fileInput?.click()" @dragover.prevent @drop.prevent="handleDrop">
                <p class="text-4xl mb-2">📂</p>
                <p class="text-gray-600 text-sm">Arrastra tu archivo CSV aquí o haz clic para seleccionar</p>
                <input ref="fileInput" type="file" accept=".csv" class="hidden" @change="handleFile" />
            </div>

            <div v-if="preview.length > 0" class="mt-4">
                <h3 class="font-semibold text-gray-700 mb-2">Vista previa ({{ preview.length }} estudiantes)</h3>
                <div class="max-h-48 overflow-y-auto border rounded">
                    <table class="w-full text-xs">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-3 py-2 text-left">Nombre</th>
                                <th class="px-3 py-2 text-left">Email</th>
                                <th class="px-3 py-2 text-left">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(row, i) in preview" :key="i" class="border-t">
                                <td class="px-3 py-2">{{ row.name }}</td>
                                <td class="px-3 py-2">{{ row.email }}</td>
                                <td class="px-3 py-2">
                                    <span v-if="row.status === 'ok'" class="text-green-600">✅ Listo</span>
                                    <span v-else-if="row.status === 'imported'" class="text-blue-600">✅ Importado</span>
                                    <span v-else-if="row.status === 'error'" class="text-red-500">❌ {{ row.error
                                        }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="mt-4 flex gap-3">
                    <button @click="handleImport" :disabled="importing"
                        class="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                        {{ importing ? 'Importando...' : `Importar ${preview.length} estudiantes` }}
                    </button>
                    <button @click="clearFile" class="flex-1 border py-2 rounded text-sm hover:bg-gray-50">
                        Limpiar
                    </button>
                </div>
            </div>

            <div v-if="summary" class="mt-4 p-3 rounded text-sm"
                :class="summary.errors > 0 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'">
                ✅ Importados: {{ summary.success }} | ❌ Errores: {{ summary.errors }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createUser } from '../../api/users'

const fileInput = ref<HTMLInputElement>()
const preview = ref<any[]>([])
const importing = ref(false)
const summary = ref<any>(null)

function downloadTemplate() {
    const csv = 'nombre,email,password\nJuan Pérez,juan@email.com,contraseña123'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_estudiantes.csv'
    a.click()
}

function parseCSV(text: string) {
    const lines = text.trim().split('\n')
    const data = []
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        if (!line) continue
        const parts = line.split(',').map((s: string) => s.trim())
        const name = parts[0]
        const email = parts[1]
        const password = parts[2]
        if (name && email && password) {
            data.push({ name, email, password, status: 'ok' })
        }
    }
    return data
}

function handleFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
        preview.value = parseCSV(ev.target?.result as string)
        summary.value = null
    }
    reader.readAsText(file)
}

function handleDrop(e: DragEvent) {
    const file = e.dataTransfer?.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
        preview.value = parseCSV(ev.target?.result as string)
        summary.value = null
    }
    reader.readAsText(file)
}

async function handleImport() {
    importing.value = true
    let success = 0
    let errors = 0

    for (const row of preview.value) {
        try {
            await createUser({ name: row.name, email: row.email, password: row.password, role: 'STUDENT' })
            row.status = 'imported'
            success++
        } catch (e: any) {
            row.status = 'error'
            row.error = e.response?.data?.message ?? 'Error'
            errors++
        }
    }

    summary.value = { success, errors }
    importing.value = false
}

function clearFile() {
    preview.value = []
    summary.value = null
    if (fileInput.value) fileInput.value.value = ''
}
</script>