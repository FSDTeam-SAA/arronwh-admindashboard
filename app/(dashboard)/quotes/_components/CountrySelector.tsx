"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { countries } from "./contries";

interface CountrySelectorProps {
  selectedCountry: typeof countries[0];
  onSelect: (country: typeof countries[0]) => void;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filteredCountries = useMemo(() => {
    if (!search) return countries;
    const lowerSearch = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.dial_code.includes(search) ||
        c.code.toLowerCase().includes(lowerSearch)
    );
  }, [search]);

  // Reset active index when search changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [search]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filteredCountries.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const country = filteredCountries[activeIndex];
      onSelect(country);
      setOpen(false);
      setSearch("");
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  return (
    <>
      <style jsx global>{`
        .country-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .country-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .country-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .country-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .country-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
          overscroll-behavior: contain;
        }
      `}</style>

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[6px] bg-white px-3 shadow-sm transition-all hover:bg-gray-50 focus:outline-none"
          >
            <div className="flex h-6 w-8 items-center justify-center overflow-hidden rounded-sm border border-gray-100">
              <Image
                src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
                alt={selectedCountry.name}
                width={1000}
                height={1000}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-sm font-medium text-[#2D3D4D]">{selectedCountry.dial_code}</span>
            <ChevronDown className={cn("h-4 w-4 text-[#2D3D4D] transition-transform", open && "rotate-180")} />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={8}
            className="z-[100] w-[320px] rounded-xl border border-gray-100 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onKeyDown={handleKeyDown}
          >
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                placeholder="Search country or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg bg-gray-50 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div 
              ref={scrollContainerRef}
              onWheel={(e) => e.stopPropagation()}
              className="country-scrollbar h-[300px] overflow-y-auto overflow-x-hidden pr-1 overscroll-contain"
            >
              <div className="space-y-0.5">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country, index) => (
                    <button
                      key={country.code}
                      ref={(el) => {
                        itemRefs.current[index] = el;
                      }}
                      onClick={() => {
                        onSelect(country);
                        setOpen(false);
                        setSearch("");
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        (selectedCountry.code === country.code || activeIndex === index) 
                          ? "bg-gray-100 font-semibold" 
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="flex h-5 w-7 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-gray-100">
                        <Image
                          width={1000}
                          height={1000}
                          src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                          alt={country.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="flex-1 truncate text-[#2D3D4D]">{country.name}</span>
                      <span className="text-xs text-gray-400">{country.dial_code}</span>
                      {selectedCountry.code === country.code && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-gray-500">
                    No results found
                  </div>
                )}
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
};

export default CountrySelector;
