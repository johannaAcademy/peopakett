import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import App from './App.vue';
import HomeView from './views/HomeView.vue';
import PlannerView from './views/PlannerView.vue';
import PricingView from './views/PricingView.vue';
import AdminView from './views/AdminView.vue';

describe('App shell', () => {
  it('renders the main navigation and home route', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: HomeView },
        { path: '/planner', name: 'planner', component: PlannerView },
        { path: '/pricing', name: 'pricing', component: PricingView },
        { path: '/admin', name: 'admin', component: AdminView },
      ],
    });

    await router.push('/');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    expect(wrapper.find('.brand').exists()).toBe(true);
    expect(wrapper.text()).toContain('Moodne peopakett');
    expect(wrapper.text()).toContain('Vähem korraldusmuret');
  });
});
