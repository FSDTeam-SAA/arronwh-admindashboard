"use client";

import { useQuery } from "@tanstack/react-query";

export interface ApiController {
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
  data: ApiController[];
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchControllers(): Promise<ApiController[]> {
  const res = await fetch(`${BASE_URL}/controller`);
  if (!res.ok) throw new Error("Failed to fetch controllers");
  const json: ApiResponse = await res.json();
  return json.data;
}

export function useControllers() {
  return useQuery({
    queryKey: ["controllers"],
    queryFn: fetchControllers,
  });
}
