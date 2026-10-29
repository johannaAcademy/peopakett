import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import HomeView from './HomeView.vue';

const mountHome = () =>
  mount(HomeView, {
    global: {
      stubs: {
        RouterLink: {
          template: '<a><slot /></a>',
        },
      },
    },
  });

describe('HomeView', () => {
  it('shows the public landing page sections and transparent product pricing', () => {
    const wrapper = mountHome();

    expect(wrapper.get('h1').text()).toContain('Vähem korraldusmuret');
    expect(wrapper.text()).toContain('Leia oma peo meeleolu');
    expect(wrapper.text()).toContain('Kolm sammu peoni');
    expect(wrapper.text()).toContain('Complete Party Plan');
    expect(wrapper.text()).toContain('Party Website');
    expect(wrapper.text()).toContain('Party Box');
    expect(wrapper.text()).toContain('Korduma kippuvad küsimused');
    expect(wrapper.text()).toContain('Näidisjaotus on illustratiivne');
  });

  it('updates the illustrative budget allocation and per-guest amount', async () => {
    const wrapper = mountHome();

    await wrapper.get('#budget-range').setValue('1200');
    await wrapper.get('#guest-count').setValue('12');

    const rows = wrapper.findAll('.budget-row');
    expect(rows).toHaveLength(4);
    expect(rows[0].text()).toContain('420');
    expect(rows[1].text()).toContain('300');
    expect(rows[2].text()).toContain('240');
    expect(rows[3].text()).toContain('240');
    expect(wrapper.get('.per-guest').text()).toContain('100');
  });

  it('does not calculate a per-guest value for an invalid guest count', async () => {
    const wrapper = mountHome();

    await wrapper.get('#guest-count').setValue('0');

    expect(wrapper.get('.per-guest').text()).toContain('—');
  });
});
