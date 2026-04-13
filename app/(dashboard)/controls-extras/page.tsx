"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ControllersSection } from "./_components/ControllersSection";
import { ExtrasSection } from "./_components/ExtrasSection";
import { AddControllerModal } from "./_components/AddControllerModal";
import { AddExtraModal } from "./_components/AddExtraModal";

type TabType = "controllers" | "extras";

export default function ControlsExtrasManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("controllers");
  const [openAddControllerModal, setOpenAddControllerModal] = useState(false);
  const [openAddExtraModal, setOpenAddExtraModal] = useState(false);

  const sectionTitle = useMemo(() => {
    return activeTab === "controllers" ? "Controllers" : "System Care";
  }, [activeTab]);

  const buttonLabel = useMemo(() => {
    return activeTab === "controllers"
      ? "Add New Controllers"
      : "Add New Extras";
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#EEF2F5] px-4 py-5 sm:px-6 lg:px-5">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[22px] font-bold leading-none text-[#2D3D4D] sm:text-[32px]">
              Controls & Extras Management
            </h1>

            <div className="mt-3 flex items-center gap-2 text-[14px] font-medium text-[#2D3D4D] sm:text-[16px]">
              <Link href="/" className="transition hover:text-[#00A56F]">
                Dashboard
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
              <span>Controls & Extras Management</span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 sm:items-end">
            {/* Tabs */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("controllers")}
                className={cn(
                  "h-[38px] min-w-[104px] rounded-[8px] px-5 text-[15px] font-medium transition",
                  activeTab === "controllers"
                    ? "bg-[#F5D64E] text-[#2D3D4D]"
                    : "bg-white text-[#2D3D4D]"
                )}
              >
                Controllers
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("extras")}
                className={cn(
                  "h-[38px] min-w-[80px] rounded-[8px] px-5 text-[15px] font-medium transition",
                  activeTab === "extras"
                    ? "bg-[#F5D64E] text-[#2D3D4D]"
                    : "bg-white text-[#2D3D4D]"
                )}
              >
                Extras
              </button>
            </div>

            <Button
              onClick={() =>
                activeTab === "controllers"
                  ? setOpenAddControllerModal(true)
                  : setOpenAddExtraModal(true)
              }
              className="h-[44px] rounded-[8px] bg-[#F5D64E] px-6 text-[16px] font-medium text-[#2D3D4D] hover:bg-[#edcf47]"
            >
              <span className="mr-2 text-[18px]">+</span>
              {buttonLabel}
            </Button>
          </div>
        </div>

        {/* Section Title */}
        <h2 className="mb-5 text-[24px] font-bold text-[#2D3D4D] sm:text-[28px]">
          {sectionTitle}
        </h2>

        {/* Content */}
        {activeTab === "controllers" ? (
          <ControllersSection />
        ) : (
          <ExtrasSection />
        )}
      </div>

      <AddControllerModal
        open={openAddControllerModal}
        onOpenChange={setOpenAddControllerModal}
      />

      <AddExtraModal
        open={openAddExtraModal}
        onOpenChange={setOpenAddExtraModal}
      />
    </div>
  );
}
