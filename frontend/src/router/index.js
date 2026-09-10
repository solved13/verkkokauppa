import { createRouter, createWebHistory } from 'vue-router'
import { token, user } from '../store.js'

const routes = [
  {
    path: '/login',
    name: 'auth',
    component: () => import('../views/AuthView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/shop/:category(old|new)',
    name: 'shop',
    component: () => import('../views/ShopView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/payment',
    name: 'payment',
    component: () => import('../views/PaymentView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/products/new',
    name: 'addProduct',
    component: () => import('../views/AddProductView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  // Tuntemattomat osoitteet -> etusivulle (joka ohjaa kirjautumiseen, jos ei olla sisäänkirjautuneita)
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const isLoggedIn = !!token.value

  if (to.meta.requiresAuth && !isLoggedIn) {
    return '/login'
  }
  if (to.meta.guestOnly && isLoggedIn) {
    return '/'
  }
  if (to.meta.requiresAdmin && !(user.value && user.value.isAdmin)) {
    return '/'
  }
  return true
})

export default router
