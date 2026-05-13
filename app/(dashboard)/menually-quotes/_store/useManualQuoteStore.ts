import { create } from 'zustand';

export type ManualQuoteFormData = {
  quoteId: string;
  title: string;
  firstName: string;
  surname: string;
  email: string;
  address: string;
  postcode: string;
  mobileNumber: string;
  marketingConsent: boolean;
};

type ManualQuoteState = {
  formData: ManualQuoteFormData | null;
  setFormData: (data: ManualQuoteFormData) => void;
  clearFormData: () => void;
};

export const useManualQuoteStore = create<ManualQuoteState>((set) => ({
  formData: null,
  setFormData: (data) => set({ formData: data }),
  clearFormData: () => set({ formData: null }),
}));
