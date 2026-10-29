import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PricingView from './PricingView.vue';

describe('PricingView', () => {
  it('shows the published package prices and separates optional services', () => {
    const wrapper = mount(PricingView, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('29 €');
    expect(wrapper.text()).toContain('100 €');
    expect(wrapper.text()).toContain('50 €/h');
    expect(wrapper.text()).toContain('baashind alates 150 €');
    expect(wrapper.text()).toContain('Party Boxi saab tellida ka ilma digitaalse peoplaanita');
    expect(wrapper.text()).toContain('Täisteenus');
    expect(wrapper.text()).toContain('lõplik hind kinnitatakse enne tellimust');
  });
});
