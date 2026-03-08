import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Itinerary, AIDayResult } from '../types/itinerary';

export const useItineraryStore = defineStore('itinerary', () => {
  const currentItinerary = ref<Itinerary | null>(null);
  const selectedDayIndex = ref(0);
  const isGenerating = ref(false);
  const generatingStatus = ref('');
  const generatedDays = ref<AIDayResult[]>([]);
  const pendingSave = ref(false);

  function setItinerary(data: Itinerary) {
    currentItinerary.value = data;
    selectedDayIndex.value = 0;
  }

  function setSelectedDay(index: number) {
    selectedDayIndex.value = index;
  }

  function startGenerating() {
    isGenerating.value = true;
    generatedDays.value = [];
    generatingStatus.value = '';
  }

  function addGeneratedDay(day: AIDayResult) {
    generatedDays.value.push(day);
  }

  function setStatus(status: string) {
    generatingStatus.value = status;
  }

  function finishGenerating() {
    isGenerating.value = false;
  }

  function markPendingSave() {
    pendingSave.value = true;
  }

  function clearPendingSave() {
    pendingSave.value = false;
  }

  function reset() {
    currentItinerary.value = null;
    selectedDayIndex.value = 0;
    isGenerating.value = false;
    generatingStatus.value = '';
    generatedDays.value = [];
    pendingSave.value = false;
  }

  return {
    currentItinerary,
    selectedDayIndex,
    isGenerating,
    generatingStatus,
    generatedDays,
    pendingSave,
    setItinerary,
    setSelectedDay,
    startGenerating,
    addGeneratedDay,
    setStatus,
    finishGenerating,
    markPendingSave,
    clearPendingSave,
    reset,
  };
});
