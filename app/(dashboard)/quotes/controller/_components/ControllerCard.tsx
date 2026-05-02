"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiController } from "./useControllers";



function formatPrice(price: number): string {
  if (price <= 0) return "Included";
  return `£${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
}

interface ControllerCardProps {
  item: ApiController;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ControllerCard({ item, isSelected, onSelect }: ControllerCardProps) {
  const priceText = formatPrice(item.price);
  const imageSrc = item.images[0] ?? "/product.png";

  return (
    <div className="rounded-[6px] bg-white p-4 shadow-sm sm:p-5">
      <div className="relative flex min-h-[220px] items-center justify-center rounded-[8px] bg-[#FBFCFD]">

        <Image
          src={imageSrc}
          alt={item.title}
          width={240}
          height={220}
          className="h-[180px] w-auto object-contain sm:h-[210px]"
        />
      </div>

      <div className="mt-5">
        <h3 className="text-[20px] sm:text-[22px] font-bold leading-tight text-[#2D3D4D]">
          {item.title}
        </h3>

        <div
          className="mt-3 text-[14px] sm:text-[15px] leading-7 text-[#2D3D4D] [&_p]:mb-0"
          dangerouslySetInnerHTML={{ __html: item.description }}
        />

        <p className="mt-4 text-[28px] font-bold text-[#2D3D4D]">{priceText}</p>

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
