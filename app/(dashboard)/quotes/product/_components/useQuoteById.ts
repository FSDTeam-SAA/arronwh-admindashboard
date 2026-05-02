"use client";

import { useQuery } from "@tanstack/react-query";

export interface ApiQuoteProductFeature {
  title?: string;
  value?: string;
}

export interface ApiQuoteProduct {
  _id: string;
  title: string;
  price?: number;
  discountPrice?: number;
  payablePrice?: number;
  monthlyPrice?: number;
  boilerAbility?: string;
  boilerFeatures?: ApiQuoteProductFeature[];
  boilerIncludedData?: string;
}

export interface ApiQuoteController {
  _id: string;
  title: string;
  price?: number;
  images?: string[];
}

export interface ApiQuoteExtra {
  _id: string;
  title: string;
  description?: string;
  badges?: string[];
  price?: number;
  discount?: number;
  images?: string[];
}

export interface ApiQuoteQuizAnswer {
  question: string;
  answer: string;
  price?: number | null;
}

export interface ApiQuotePersonalInfo {
  title?: string;
  fastName?: string;
  sureName?: string;
  email?: string;
  mobleNumber?: string;
  postcode?: string | null;
}

export interface ApiQuote {
  _id: string;
  productId?: ApiQuoteProduct | string | null;
  controller?: ApiQuoteController | string | null;
  extra?: ApiQuoteExtra | string | null;
  quizAnswers?: ApiQuoteQuizAnswer[];
  personalInfo?: ApiQuotePersonalInfo | null;
  installAddress?: string;
  surveyDate?: string;
  installDate?: string;
  payByCard?: boolean;
  payMounthly?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

type QuoteApiResponse = {
  success?: boolean;
  status?: boolean;
  message?: string;
  data?: ApiQuote;
};

function resolveQuoteEndpoint() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/quote`;
  }
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/quote`;
  }
  return "/quote";
}

async function fetchQuoteById(id: string): Promise<ApiQuote> {
  const response = await fetch(`${resolveQuoteEndpoint()}/${encodeURIComponent(id)}`);
  const result = (await response.json().catch(() => null)) as QuoteApiResponse | null;
  const hasExplicitFailure = result?.success === false || result?.status === false;

  if (!response.ok || hasExplicitFailure || !result?.data) {
    throw new Error(result?.message || "Failed to fetch quote");
  }

  return result.data;
}

export function useQuoteById(id: string | null) {
  return useQuery({
    queryKey: ["quote", id],
    queryFn: () => fetchQuoteById(id!),
    enabled: !!id,
  });
}
