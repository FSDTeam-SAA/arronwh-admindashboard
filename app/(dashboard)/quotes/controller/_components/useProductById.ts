"use client";

import { useQuery } from "@tanstack/react-query";

export interface ApiProductFeature {
  title: string;
  value: string;
}

export interface ApiProductFull {
  _id: string;
  title: string;
  description: string;
  shortDescription: string;
  images: string[];
  badges: string[];
  price: number;
  discountPrice: number;
  payablePrice: number;
  monthlyPrice: number;
  boilerAbility: string;
  boilerFeatures: ApiProductFeature[];
  featureInformation: {
    featureTitle: string;
    featureDescription: string;
    featureLogo: string[];
  };
  boilerIncludedData: string;
  includedImages: string[];
  boilerInstallationGuide: { title: string; image: string }[];
}

interface ApiResponse {
  statusCode: number;
  success: boolean;
  data: ApiProductFull;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchProductById(id: string): Promise<ApiProductFull> {
  const res = await fetch(`${BASE_URL}/products/${id}`);
  if (!res.ok) throw new Error("Failed to fetch product");
  const json: ApiResponse = await res.json();
  return json.data;
}

export function useProductById(id: string | null) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductById(id!),
    enabled: !!id,
  });
}
