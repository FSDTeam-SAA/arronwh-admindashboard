"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

type ExtraApiItem = {
  _id: string;
  title: string;
  description?: string;
  badges?: string[];
  price?: number;
  discount?: number;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

type ExtraApiResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  data: ExtraApiItem[];
};

type ExtraItem = {
  id: string;
  title: string;
  description: string;
  priceLabel: string;
  image: string;
};

export function ExtrasSection() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const extraQuery = useQuery<ExtraApiResponse>({
    queryKey: ["extras", token],
    queryFn: async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${apiBase}/extra`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.success === false || data?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to load extras.");
      }

      return data;
    },
  });

  const items = useMemo<ExtraItem[]>(() => {
    return (
      extraQuery.data?.data?.map((item) => ({
        id: item._id,
        title: item.title,
        description: item.description ?? "",
        priceLabel:
          typeof item.price === "number" ? `£${item.price.toFixed(2)}` : "Included",
        image: item.images?.[0] ?? "/extra-1.png",
      })) ?? []
    );
  }, [extraQuery.data]);

  if (extraQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-[425px] flex-col rounded-[4px] bg-white p-4 sm:p-5"
          >
            <div className="flex justify-center">
              <div className="h-[190px] w-full max-w-[260px] animate-pulse rounded-[8px] bg-[#E5E7EB]" />
            </div>

            <div className="mt-6 flex flex-1 flex-col">
              <div className="h-5 w-3/4 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-full animate-pulse rounded-[6px] bg-[#F0F3F6]" />
                <div className="h-4 w-5/6 animate-pulse rounded-[6px] bg-[#F0F3F6]" />
              </div>
              <div className="mt-4 h-5 w-20 animate-pulse rounded-[6px] bg-[#E5E7EB]" />

              <div className="mt-auto flex items-center justify-center gap-4 pt-12">
                <div className="h-[36px] w-[140px] animate-pulse rounded-full bg-[#E5E7EB]" />
                <div className="h-8 w-8 animate-pulse rounded-full bg-[#E5E7EB]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex min-h-[425px] flex-col rounded-[4px] bg-white p-4 sm:p-5"
        >
          <div className="flex justify-center">
            <div className="relative h-[190px] w-full max-w-[260px]">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-1 flex-col">
            <h3 className="text-[18px] font-bold leading-7 text-[#2D3D4D]">
              {item.title}
            </h3>

            <div
              className="mt-3 text-[16px] leading-7 text-[#2D3D4D]"
              dangerouslySetInnerHTML={{ __html: item.description }}
            />

            <p className="mt-3 text-[18px] font-bold text-[#2D3D4D]">
              {item.priceLabel}
            </p>

            <div className="mt-auto flex items-center justify-center gap-4 pt-12">
              <button
                type="button"
                className="inline-flex h-[36px] items-center rounded-full bg-[#00A56F1A] px-4 text-[16px] font-medium text-[#12A150]"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Details
              </button>

              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#F5D64E] transition hover:bg-[#FFF8DB]"
              >
                <Trash2 className="h-4 w-4 text-[#FFDE59]" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {!extraQuery.isLoading && items.length === 0 && (
        <div className="col-span-full rounded-[12px] border border-dashed border-[#CBD5E1] bg-white p-8 text-center">
          <p className="text-[16px] text-[#64748B]">No extras added yet.</p>
        </div>
      )}
    </div>
  );
}
