"use client";

import { useQuery } from "@tanstack/react-query";

export interface ApiExtra {
  _id: string;
  title: string;
  description: string;
  badges: string[];
  price: number;
  discount: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  data: ApiExtra[];
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchExtras(): Promise<ApiExtra[]> {
  const res = await fetch(`${BASE_URL}/extra`);
  if (!res.ok) throw new Error("Failed to fetch extras");

  const json: ApiResponse = await res.json();
  if (!json.success) {
    throw new Error(json.message || "Failed to fetch extras");
  }

  return json.data ?? [];
}

export function useExtras() {
  return useQuery({
    queryKey: ["extras"],
    queryFn: fetchExtras,
  });
}

