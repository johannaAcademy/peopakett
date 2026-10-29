import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PlannerView from './PlannerView.vue';

const mountPlanner = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/planner', component: { template: '<div />' } }],
  });
  await router.push('/planner');
  await router.isReady();
  return mount(PlannerView, {
    global: {
      plugins: [createPinia(), router],
      stubs: {
        RouterLink: {
          template: '<a><slot /></a>',
        },
      },
    },
  });
};

const advance = (wrapper: Awaited<ReturnType<typeof mountPlanner>>) =>
  wrapper.get('.planner-actions .button-primary').trigger('click');

const futureDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

describe('PlannerView', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  it('validates each step, preserves choices when navigating back, and builds a review', async () => {
    const wrapper = await mountPlanner();

    await advance(wrapper);
    expect(wrapper.text()).toContain('Lisa peole nimi.');
    expect(wrapper.get('h1').text()).toContain('Sinu pidu, sinu plaan.');

    await wrapper.get('#party-title').setValue('Mia sünnipäev');
    await wrapper.get('input[name="partyType"][value="birthday"]').setValue(true);
    await wrapper.get('input[name="audience"][value="children"]').setValue(true);
    await wrapper.get('#age-group').setValue('6–12 aastat');
    await advance(wrapper);
    expect(wrapper.text()).toContain('Leia peole sobiv meeleolu.');

    await wrapper.get('input[name="theme"][value="pirate"]').setValue(true);
    await advance(wrapper);
    expect(wrapper.text()).toContain('Kus ja millal pidu toimub?');

    await wrapper.get('#event-date').setValue(futureDate());
    await wrapper.get('#event-time').setValue('14:00');
    await wrapper.get('#location').setValue('Tartu');
    await wrapper.get('input[name="venueType"][value="outdoor"]').setValue(true);
    await wrapper.get('input[name="venueNeed"][value="have-venue"]').setValue(true);
    await advance(wrapper);
    expect(wrapper.text()).toContain('Mis on sinu eelarve?');

    await advance(wrapper);
    expect(wrapper.text()).toContain('Ideed sinu peo jaoks.');
    expect(wrapper.text()).toContain('vihmaplaan');
    await wrapper.get('.planner-step-list button').trigger('click');
    expect(wrapper.get<HTMLInputElement>('#party-title').element.value).toBe('Mia sünnipäev');
  });

  it('adds known and quote-based costs and shows a clearly qualified preview', async () => {
    const wrapper = await mountPlanner();

    await wrapper.get('#party-title').setValue('Mia sünnipäev');
    await wrapper.get('input[name="partyType"][value="birthday"]').setValue(true);
    await wrapper.get('input[name="audience"][value="children"]').setValue(true);
    await wrapper.get('#age-group').setValue('6–12 aastat');
    await advance(wrapper);

    await wrapper.get('input[name="theme"][value="adventure"]').setValue(true);
    await advance(wrapper);

    await wrapper.get('#event-date').setValue(futureDate());
    await wrapper.get('#event-time').setValue('14:00');
    await wrapper.get('#location').setValue('Tartu');
    await wrapper.get('input[name="venueType"][value="indoor"]').setValue(true);
    await wrapper.get('input[name="venueNeed"][value="have-venue"]').setValue(true);
    await advance(wrapper);
    await advance(wrapper);

    await wrapper.findAll('.small-button')[0].trigger('click');
    await wrapper.findAll('.small-button')[3].trigger('click');
    await advance(wrapper);

    expect(wrapper.text()).toContain('Complete Party Plan');
    expect(wrapper.text()).toContain('Party Box');
    expect(wrapper.text()).toContain('Hind selgub pakkumisel');
    expect(wrapper.text()).toContain('Teadaolevad kulud');
    expect(wrapper.text()).toContain('Mõni rida vajab tarnija pakkumist');
    expect(wrapper.text()).toContain('mitte salvestatud tellimus ega pakkumine');
  });
});
