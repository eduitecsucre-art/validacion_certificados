<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Editor de Plantilla</h1>
        <p class="text-sm text-gray-500">{{ course?.name ?? 'Cargando curso...' }}</p>
      </div>
      <div class="flex gap-2">
        <label class="bg-white border px-4 py-2 rounded-md text-sm hover:bg-gray-50 cursor-pointer">
          {{ template ? 'Cambiar imagen' : 'Subir imagen' }}
          <input type="file" accept="image/*" class="hidden" @change="handleImageChange" />
        </label>
        <button v-if="template" @click="handleSave" :disabled="saving"
          class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
          {{ saving ? 'Guardando...' : 'Guardar plantilla' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="text-red-500 text-sm mb-4">{{ error }}</p>
    <p v-if="saveSuccess" class="text-green-600 text-sm mb-4">{{ saveSuccess }}</p>

    <div v-if="!template" class="bg-white rounded-lg shadow p-10 text-center text-gray-400">
      Este curso todavía no tiene una plantilla. Sube una imagen de fondo (el diploma en blanco) para empezar.
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Paleta de campos -->
      <div class="bg-white rounded-lg shadow p-4 space-y-2">
        <h2 class="font-semibold text-gray-700 text-sm mb-2">Campos disponibles</h2>
        <button v-for="ft in fieldTypes" :key="ft.type"
          :disabled="isPlaced(ft.type)"
          @click="addField(ft.type)"
          class="w-full text-left text-sm px-3 py-2 rounded border hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed">
          + {{ ft.label }}
        </button>

        <div v-if="selectedField" class="pt-4 mt-4 border-t space-y-3">
          <h3 class="font-semibold text-gray-700 text-sm">
            {{ fieldLabel(selectedField.type) }}
          </h3>

          <div v-if="selectedField.type === 'customText'">
            <label class="text-xs text-gray-500">Texto</label>
            <input v-model="selectedField.text" placeholder="Ej: del, al, de"
              class="w-full border rounded px-2 py-1 text-sm" />
          </div>

          <div v-if="selectedField.type === 'hours'">
            <label class="text-xs text-gray-500">Texto después del número</label>
            <input v-model="selectedField.hoursSuffix" placeholder="Ej: ' horas', 'h', o vacío"
              class="w-full border rounded px-2 py-1 text-sm" />
          </div>

          <div v-if="selectedField.type !== 'qr'">
            <label class="text-xs text-gray-500">Tipo de letra</label>
            <select v-model="selectedField.fontFamily" class="w-full border rounded px-2 py-1 text-sm">
              <option value="Helvetica">Helvetica (sans-serif)</option>
              <option value="Times-Roman">Times Roman (serif)</option>
              <option value="Courier">Courier (monoespaciada)</option>
            </select>
          </div>

          <div v-if="selectedField.type !== 'qr'" class="flex gap-4">
            <label class="flex items-center gap-1 text-xs text-gray-500">
              <input type="checkbox" v-model="selectedField.bold" /> Negrita
            </label>
            <label class="flex items-center gap-1 text-xs text-gray-500">
              <input type="checkbox" v-model="selectedField.italic" /> Cursiva
            </label>
          </div>

          <div v-if="selectedField.type !== 'qr'">
            <label class="text-xs text-gray-500">Tamaño de letra ({{ selectedField.fontSize }})</label>
            <input type="range" min="10" max="72" v-model.number="selectedField.fontSize" class="w-full" />
          </div>

          <div v-if="selectedField.type !== 'qr'">
            <label class="text-xs text-gray-500">Color</label>
            <input type="color" v-model="selectedField.color" class="w-full h-8 rounded border" />
          </div>

          <div v-if="selectedField.type !== 'qr'">
            <label class="text-xs text-gray-500">Alineación</label>
            <select v-model="selectedField.align" class="w-full border rounded px-2 py-1 text-sm">
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
            </select>
          </div>

          <div v-if="selectedField.type === 'qr'">
            <label class="text-xs text-gray-500">Tamaño del QR ({{ selectedField.size }}%)</label>
            <input type="range" min="5" max="35" v-model.number="selectedField.size" class="w-full" />
          </div>

          <button @click="removeField(selectedField.id)"
            class="w-full text-red-500 text-xs hover:underline pt-1">
            Quitar este campo
          </button>
        </div>

        <p class="text-xs text-gray-400 pt-4 border-t mt-4">
          Arrastra cada campo sobre la imagen para ubicarlo. Haz click en uno para editar su estilo.
          "Texto libre" se puede agregar varias veces, para armar frases como "del ⟨día⟩ al ⟨día⟩ de ⟨mes⟩".
        </p>
      </div>

      <!-- Canvas de la plantilla -->
      <div class="lg:col-span-3 bg-white rounded-lg shadow p-4">
        <div ref="containerRef"
          class="relative w-full border rounded overflow-hidden select-none"
          style="aspect-ratio: 1.414 / 1;">
          <img :src="template.imageUrl" class="absolute inset-0 w-full h-full object-contain pointer-events-none" />

          <div v-for="field in template.fields" :key="field.id"
            @mousedown="startDrag(field, $event)"
            :style="fieldStyle(field)"
            :class="[
              'absolute cursor-move px-1 whitespace-nowrap',
              selectedField?.id === field.id ? 'ring-2 ring-blue-500' : 'ring-1 ring-dashed ring-gray-300'
            ]">
            <span v-if="field.type !== 'qr'"
              :style="{
                color: field.color,
                fontSize: previewFontSize(field),
                textAlign: field.align,
                fontFamily: previewFontFamily(field.fontFamily),
                fontWeight: field.bold ? 'bold' : 'normal',
                fontStyle: field.italic ? 'italic' : 'normal',
              }">
              {{ fieldSampleText(field) }}
            </span>
            <div v-else
              class="bg-gray-200 flex items-center justify-center text-gray-500 text-xs aspect-square"
              :style="{ width: field.size + 'cqw' }">
              QR
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'
import { getCourse } from '../../api/courses'
import { getTemplateByCourse, uploadTemplate, updateTemplateFields } from '../../api/templates'

const route = useRoute()
const courseId = route.params.courseId as string

const course = ref<any>(null)
const template = ref<any>(null)
const error = ref('')
const saveSuccess = ref('')
const saving = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const selectedFieldId = ref<string | null>(null)

// Mismo ancho de referencia que usa el backend para escalar tamaños de
// letra. Debe coincidir siempre con REFERENCE_WIDTH en pdf-generator.service.ts.
const REFERENCE_WIDTH = 1000
const containerWidth = ref(0)
let resizeObserver: ResizeObserver | null = null

const fieldTypes = [
  { type: 'studentName', label: 'Nombre del estudiante' },
  { type: 'courseName', label: 'Nombre del curso' },
  { type: 'instructor', label: 'Instructor' },
  { type: 'startDate', label: 'Fecha inicio (dd/mm/aaaa)' },
  { type: 'endDate', label: 'Fecha fin (dd/mm/aaaa)' },
  { type: 'startDay', label: 'Día inicio (solo número)' },
  { type: 'endDay', label: 'Día fin (solo número)' },
  { type: 'month', label: 'Mes (en letras)' },
  { type: 'year', label: 'Año' },
  { type: 'hours', label: 'Horas académicas' },
  { type: 'code', label: 'Código del certificado' },
  { type: 'customText', label: '+ Texto libre' },
  { type: 'qr', label: 'Código QR' },
]

const sampleText: Record<string, string> = {
  studentName: 'Juan Pérez Gómez',
  courseName: 'Nombre del Curso',
  instructor: 'Ing. Instructor',
  startDate: '1/1/2026',
  endDate: '5/1/2026',
  startDay: '14',
  endDay: '21',
  month: 'agosto',
  year: '2026',
  code: 'CERT-2026-00000',
}

const selectedField = computed(() =>
  template.value?.fields.find((f: any) => f.id === selectedFieldId.value) ?? null
)

function fieldLabel(type: string) {
  return fieldTypes.find(ft => ft.type === type)?.label ?? type
}

// "customText" se puede agregar varias veces; el resto de los campos, solo una.
function isPlaced(type: string) {
  if (type === 'customText') return false
  return template.value?.fields.some((f: any) => f.type === type) ?? false
}

function fieldStyle(field: any) {
  return {
    left: field.x + '%',
    top: field.y + '%',
    transform: 'translate(-50%, -50%)',
  }
}

function fieldSampleText(field: any): string {
  if (field.type === 'customText') return field.text || '(texto vacío)'
  if (field.type === 'hours') return `40${field.hoursSuffix ?? ' horas'}`
  return sampleText[field.type] ?? ''
}

// Traduce el tamaño "normalizado" (relativo a 1000px de ancho) al tamaño en
// px que corresponde en el contenedor real de la vista previa, para que se
// vea igual de grande que en el PDF final, sin importar el tamaño de pantalla.
function previewFontSize(field: any): string {
  if (!field.fontSize || !containerWidth.value) return field.fontSize + 'px'
  return ((field.fontSize / REFERENCE_WIDTH) * containerWidth.value) + 'px'
}

function previewFontFamily(fontFamily: string) {
  const map: Record<string, string> = {
    'Helvetica': 'Arial, Helvetica, sans-serif',
    'Times-Roman': '"Times New Roman", Times, serif',
    'Courier': '"Courier New", Courier, monospace',
  }
  return map[fontFamily] ?? map['Helvetica']
}

function measureContainer() {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.getBoundingClientRect().width
  }
}

function watchContainer() {
  if (containerRef.value && !resizeObserver) {
    resizeObserver = new ResizeObserver(() => measureContainer())
    resizeObserver.observe(containerRef.value)
  }
}

function addField(type: string) {
  const newField: any = {
    id: uuidv4(),
    type,
    x: 50,
    y: 50,
    fontSize: type === 'qr' ? undefined : 24,
    color: type === 'qr' ? undefined : '#1f2937',
    align: type === 'qr' ? undefined : 'center',
    fontFamily: type === 'qr' ? undefined : 'Helvetica',
    bold: type === 'qr' ? undefined : false,
    italic: type === 'qr' ? undefined : false,
    size: type === 'qr' ? 15 : undefined,
  }
  if (type === 'hours') newField.hoursSuffix = ' horas'
  if (type === 'customText') newField.text = ''
  template.value.fields.push(newField)
  selectedFieldId.value = newField.id
}

function removeField(id: string) {
  template.value.fields = template.value.fields.filter((f: any) => f.id !== id)
  if (selectedFieldId.value === id) selectedFieldId.value = null
}

function startDrag(field: any, e: MouseEvent) {
  e.preventDefault()
  selectedFieldId.value = field.id
  const container = containerRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()

  function onMove(moveEvent: MouseEvent) {
    const x = ((moveEvent.clientX - rect.left) / rect.width) * 100
    const y = ((moveEvent.clientY - rect.top) / rect.height) * 100
    field.x = Math.min(100, Math.max(0, x))
    field.y = Math.min(100, Math.max(0, y))
  }

  function onUp() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

async function handleImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  error.value = ''
  try {
    const res = await uploadTemplate(courseId, file)
    const previousFields = template.value?.fields ?? []
    template.value = { ...res.data, fields: previousFields }
    await nextTick()
    measureContainer()
    watchContainer()
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Error al subir la imagen'
  }
}

async function handleSave() {
  error.value = ''
  saveSuccess.value = ''
  saving.value = true
  try {
    await updateTemplateFields(template.value.id, template.value.fields)
    saveSuccess.value = '✅ Plantilla guardada correctamente'
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Error al guardar la plantilla'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const [courseRes, templateRes] = await Promise.all([
      getCourse(courseId),
      getTemplateByCourse(courseId),
    ])
    course.value = courseRes.data
    template.value = templateRes.data
  } catch (e: any) {
    error.value = 'Error al cargar el curso o la plantilla'
  }

  await nextTick()
  measureContainer()
  watchContainer()
  window.addEventListener('resize', measureContainer)
})

onBeforeUnmount(() => {
  if (resizeObserver && containerRef.value) resizeObserver.unobserve(containerRef.value)
  window.removeEventListener('resize', measureContainer)
})
</script>