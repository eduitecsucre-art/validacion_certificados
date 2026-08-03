import api from './index'

export const getEnrollmentsByCourse = (courseId: string) =>
  api.get(`/enrollments/course/${courseId}`)

export const getEnrollmentsByStudent = (studentId: string) =>
  api.get(`/enrollments/student/${studentId}`)

export const enrollStudent = (studentId: string, courseId: string) =>
  api.post('/enrollments', { studentId, courseId })

export const enrollMany = (studentIds: string[], courseId: string) =>
  api.post('/enrollments/many', { studentIds, courseId })

export const unenroll = (id: string) =>
  api.delete(`/enrollments/${id}`)