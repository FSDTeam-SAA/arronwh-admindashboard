"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiExtra } from "./useExtras";

interface ExtraCardProps {
  item: ApiExtra;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ExtraCard({ item, isSelected, onSelect }: ExtraCardProps) {
  const stripHtml = (html: string) => {
    if (typeof window !== "undefined") {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return doc.body.textContent || "";
    }
    return html.replace(/<[^>]*>/g, "");
  };

  const imageSrc = item.images?.[0] ?? "/product.png";

  return (
    <div className="rounded-[6px] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex min-h-[220px] items-center justify-center rounded-[8px] bg-[#FBFCFD]">
        <Image
          src={imageSrc}
          alt={item.title}
          width={240}
          height={220}
          className="h-[170px] w-auto object-contain sm:h-[200px]"
        />
      </div>

      <div className="mt-5">
        <h3 className="text-[18px] sm:text-[20px] font-bold leading-tight text-[#2D3D4D]">
          {item.title}
        </h3>

        <p className="mt-3 min-h-[78px] text-[14px] sm:text-[15px] leading-7 text-[#2D3D4D]">
          {stripHtml(item.description)}
        </p>

        <p className="mt-3 text-[26px] sm:text-[28px] font-bold text-[#2D3D4D]">
          +£{item.price}
        </p>

        <Button
          onClick={() => onSelect(item._id)}
          className={cn(
            "mt-6 h-[46px] w-full rounded-[6px] text-[15px] sm:text-[16px] font-medium gap-2",
            isSelected
              ? "bg-[#2D3D4D] text-white hover:bg-[#2D3D4D]"
              : "bg-[#00A56F] text-white hover:bg-[#009562]"
          )}
        >
          {isSelected ? (
            <>
              Added <CheckCircle className="h-5 w-5" />
            </>
          ) : (
            "Add to basket"
          )}
        </Button>
      </div>
    </div>
  );
}

export function ExtraCardSkeleton() {
  return (
    <div className="rounded-[6px] bg-white p-4 shadow-sm sm:p-5 animate-pulse">
      <div className="flex min-h-[220px] items-center justify-center rounded-[8px] bg-[#F0F3F6]" />

      <div className="mt-5">
        <div className="h-6 w-3/4 rounded bg-[#F0F3F6]" />

        <div className="mt-3 space-y-2 min-h-[78px]">
          <div className="h-4 w-full rounded bg-[#F0F3F6]" />
          <div className="h-4 w-5/6 rounded bg-[#F0F3F6]" />
          <div className="h-4 w-2/3 rounded bg-[#F0F3F6]" />
        </div>

        <div className="mt-3 h-8 w-24 rounded bg-[#F0F3F6]" />

        <div className="mt-6 h-[46px] w-full rounded-[6px] bg-[#F0F3F6]" />
      </div>
    </div>
  );
}
