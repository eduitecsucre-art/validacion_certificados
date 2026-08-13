import api from './index'

export const getTemplateByCourse = (courseId: string) => api.get(`/templates/course/${courseId}`)

export const uploadTemplate = (courseId: string, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  // No seteamos Content-Type manualmente: axios detecta que es FormData
  // y genera el header multipart/form-data con el boundary correcto solo.
  // Si lo forzamos a mano, se rompe porque falta ese boundary.
  return api.post(`/templates/course/${courseId}/upload`, formData)
}

export const updateTemplateFields = (id: string, fields: any[]) =>
  api.put(`/templates/${id}/fields`, { fields })

export const deleteTemplate = (id: string) => api.delete(`/templates/${id}`)