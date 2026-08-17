import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/mis-certificados/buscar',
      name: 'buscar-certificados',
      component: () => import('../views/public/CertificateSearchView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
    },
    {
      path: '/verificar/:code',
      name: 'verify',
      component: () => import('../views/public/VerifyView.vue'),
    },
    {
      path: '/',
      component: () => import('../components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/admin/DashboardView.vue'),
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          component: () => import('../views/admin/UsersView.vue'),
          meta: { roles: ['SUPER_ADMIN'] },
        },
        {
          path: 'inscripciones',
          name: 'inscripciones',
          component: () => import('../views/staff/EnrollmentsView.vue'),
          meta: { roles: ['SUPER_ADMIN', 'STAFF'] },
        },
        {
          path: 'cursos',
          name: 'cursos',
          component: () => import('../views/admin/CoursesView.vue'),
          meta: { roles: ['SUPER_ADMIN'] },
        },
        {
          path: 'cursos/:courseId/plantilla',
          name: 'plantilla-curso',
          component: () => import('../views/admin/TemplateEditorView.vue'),
          meta: { roles: ['SUPER_ADMIN'] },
        },
        {
          path: 'certificados',
          name: 'certificados',
          component: () => import('../views/staff/CertificatesView.vue'),
          meta: { roles: ['SUPER_ADMIN', 'STAFF'] },
        },
        {
          path: 'mis-certificados',
          name: 'mis-certificados',
          component: () => import('../views/student/MyCertificatesView.vue'),
          meta: { roles: ['STUDENT'] },
        },
        {
          path: 'perfil',
          name: 'perfil',
          component: () => import('../views/student/ProfileView.vue'),
        },
        {
          path: 'informes',
          name: 'informes',
          component: () => import('../views/admin/ReportsView.vue'),
          meta: { roles: ['SUPER_ADMIN', 'STAFF'] },
        },
        {
          path: 'importar',
          name: 'importar',
          component: () => import('../views/staff/ImportView.vue'),
          meta: { roles: ['SUPER_ADMIN', 'STAFF'] },
        },
        {
          path: 'notificaciones',
          name: 'notificaciones',
          component: () => import('../views/admin/NotificationsView.vue'),
          meta: { roles: ['SUPER_ADMIN', 'STAFF'] },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/public/NotFoundView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (auth.isAuthenticated && !auth.user) {
    await auth.fetchMe()
  }

  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    return { name: 'dashboard' }
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router