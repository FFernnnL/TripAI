import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/AuthView.vue'),
    },
    {
      path: '/plan',
      name: 'plan',
      component: () => import('../views/PlanningView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/generating',
      name: 'generating',
      component: () => import('../views/GeneratingView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/itinerary/:id',
      name: 'itinerary',
      component: () => import('../views/ItineraryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/my-trips',
      name: 'myTrips',
      component: () => import('../views/MyTripsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/share/:token',
      name: 'share',
      component: () => import('../views/SharedView.vue'),
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'auth', query: { redirect: to.fullPath } };
  }
});

export default router;
