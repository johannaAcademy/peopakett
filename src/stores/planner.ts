import { defineStore } from 'pinia';
import { defaultPlannerDraft } from '@/modules/planner/model';
import { loadSavedPlan, savePlannerDraft } from '@/modules/planner/repository';

export const usePlannerStore = defineStore('planner', {
  state: () => ({
    draft: defaultPlannerDraft(),
    savedPlanId: null as string | null,
    isSaving: false,
    saveError: '',
    saveMessage: '',
  }),
  actions: {
    async saveDraft() {
      this.isSaving = true;
      this.saveError = '';
      this.saveMessage = '';
      try {
        this.savedPlanId = await savePlannerDraft(this.draft, this.savedPlanId);
        this.saveMessage = 'Peoplaan on sinu kontole salvestatud.';
      } catch (error) {
        this.saveError =
          error instanceof Error ? error.message : 'Peoplaani salvestamine ebaõnnestus.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async openSavedDraft(planId: string) {
      this.saveError = '';
      this.saveMessage = '';
      try {
        const draft = await loadSavedPlan(planId);
        Object.assign(this.draft, draft);
        this.savedPlanId = planId;
      } catch (error) {
        this.saveError =
          error instanceof Error ? error.message : 'Salvestatud peoplaani laadimine ebaõnnestus.';
        throw error;
      }
    },
    reset() {
      Object.assign(this.draft, defaultPlannerDraft());
      this.savedPlanId = null;
      this.saveError = '';
      this.saveMessage = '';
      this.isSaving = false;
    },
  },
});
