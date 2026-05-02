import { create } from "zustand";

export type PersonalInfo = {
  title: string;
  fastName: string;
  sureName: string;
  email: string;
  mobleNumber: string;
  postcode: string;
};

type ApiQuizAnswer = {
  question: string;
  answer: string;
  price?: number;
};

type SubmitResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  data?: {
    _id?: string;
    createdAt?: string;
  };
};

type PropertyOverviewState = {
  currentStep: number;
  answers: Record<string, string>;
  selectedProductId: string | null;
  personalInfo: PersonalInfo;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccessMessage: string | null;
  quoteId: string | null;
  setAnswer: (stepId: string, answer: string) => void;
  setPersonalInfo: (key: keyof PersonalInfo, value: string) => void;
  setProductId: (productId: string) => void;
  nextStep: (maxStep: number) => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  clearSubmissionState: () => void;
  submitQuote: (quizAnswers: ApiQuizAnswer[]) => Promise<SubmitResponse | null>;
};

const defaultPersonalInfo: PersonalInfo = {
  title: "",
  fastName: "",
  sureName: "",
  email: "",
  mobleNumber: "",
  postcode: "",
};

const resolveQuoteEndpoint = () => {
  if (process.env.NEXT_PUBLIC_QUOTE_ENDPOINT) {
    return process.env.NEXT_PUBLIC_QUOTE_ENDPOINT;
  }

  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/quote`;
  }

  return "/api/quotes";
};

export const usePropertyOverviewStore = create<PropertyOverviewState>((set, get) => ({
  currentStep: 0,
  answers: {},
  selectedProductId: null,
  personalInfo: defaultPersonalInfo,
  isSubmitting: false,
  submitError: null,
  submitSuccessMessage: null,
  quoteId: null,

  setAnswer: (stepId, answer) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [stepId]: answer,
      },
      submitError: null,
      submitSuccessMessage: null,
    }));
  },

  setPersonalInfo: (key, value) => {
    set((state) => ({
      personalInfo: {
        ...state.personalInfo,
        [key]: value,
      },
      submitError: null,
      submitSuccessMessage: null,
    }));
  },

  setProductId: (productId) => {
    set({
      selectedProductId: productId,
      submitError: null,
      submitSuccessMessage: null,
    });
  },

  nextStep: (maxStep) => {
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, maxStep),
    }));
  },

  prevStep: () => {
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    }));
  },

  goToStep: (step) => {
    set({ currentStep: Math.max(step, 0) });
  },

  clearSubmissionState: () => {
    set({ submitError: null, submitSuccessMessage: null });
  },

  submitQuote: async (quizAnswers) => {
    const { selectedProductId, personalInfo } = get();

    set({
      isSubmitting: true,
      submitError: null,
      submitSuccessMessage: null,
      quoteId: null,
    });

    try {
      const response = await fetch(resolveQuoteEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProductId,
          quizAnswers,
          personalInfo,
        }),
      });

      const data: SubmitResponse = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to create quote");
      }

      set({
        isSubmitting: false,
        submitSuccessMessage: data.message || "Quote created successfully",
        quoteId: data?.data?._id || null,
      });

      return data;
    } catch (error) {
      set({
        isSubmitting: false,
        submitError:
          error instanceof Error
            ? error.message
            : "Unable to submit quote. Please try again.",
      });
      return null;
    }
  },
}));
