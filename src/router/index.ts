import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import PlannerView from '@/views/PlannerView.vue';
import PricingView from '@/views/PricingView.vue';
import AdminView from '@/views/AdminView.vue';
import AccountAuthView from '@/views/AccountAuthView.vue';
import AccountView from '@/views/AccountView.vue';

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' };
    }

    return { top: 0 };
  },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/planner', name: 'planner', component: PlannerView },
    { path: '/pricing', name: 'pricing', component: PricingView },
    { path: '/admin', name: 'admin', component: AdminView },
    { path: '/account', name: 'account', component: AccountView },
    { path: '/account/login', name: 'login', component: AccountAuthView },
    { path: '/account/register', name: 'register', component: AccountAuthView },
    { path: '/account/forgot-password', name: 'forgot-password', component: AccountAuthView },
    { path: '/account/reset', name: 'reset-password', component: AccountAuthView },
  ],
});

export default router;
