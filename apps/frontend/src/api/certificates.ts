import api from './index'

export const getCertificates = () => api.get('/certificates')
export const getMyCertificates = () => api.get('/certificates/my')
export const getCertificate = (id: string) => api.get(`/certificates/${id}`)
export const verifyCertificate = (code: string) => api.get(`/certificates/verify/${code}`)
export const createCertificate = (data: any) => api.post('/certificates', data)
export const revokeCertificate = (id: string) => api.delete(`/certificates/${id}`)
export const reactivateCertificate = (id: string) => api.patch(`/certificates/${id}/reactivate`)
export const deleteCertificatePermanent = (id: string) => api.delete(`/certificates/${id}/permanent`)