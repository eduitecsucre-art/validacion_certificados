import api from './index'

export const getCourses = () => api.get('/courses')
export const getCourse = (id: string) => api.get(`/courses/${id}`)
export const createCourse = (data: any) => api.post('/courses', data)
export const updateCourse = (id: string, data: any) => api.put(`/courses/${id}`, data)
export const deactivateCourse = (id: string) => api.delete(`/courses/${id}`)