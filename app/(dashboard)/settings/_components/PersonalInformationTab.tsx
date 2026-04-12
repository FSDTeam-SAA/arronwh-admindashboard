"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PersonalInformationTabProps {
  fullName: string;
  email: string;
  phone: string;
  bio: string;
}

export function PersonalInformationTab({
  fullName,
  email,
  phone,
  bio,
}: PersonalInformationTabProps) {
  return (
    <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)] md:p-5">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[18px] font-bold text-[#334155]">
          Personal Information
        </h2>

        <Button className="h-[40px] w-full rounded-[8px] bg-[#F5D64E] px-6 text-[15px] font-semibold text-[#334155] hover:bg-[#efcf42] sm:w-auto">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-[16px] font-medium text-[#111827]">
            Name
          </label>
          <div className="rounded-[14px] bg-[#EEF2F6] px-4 py-4 text-[18px] text-[#334155]">
            {fullName}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[16px] font-medium text-[#111827]">
              Email Address
            </label>
            <div className="rounded-[14px] bg-[#EEF2F6] px-4 py-4 text-[18px] text-[#334155]">
              {email}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[16px] font-medium text-[#111827]">
              Phone
            </label>
            <div className="rounded-[14px] bg-[#EEF2F6] px-4 py-4 text-[18px] text-[#334155]">
              {phone}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[16px] font-medium text-[#111827]">
            Bio
          </label>
          <div className="min-h-[114px] rounded-[14px] bg-[#EEF2F6] px-4 py-4 text-[16px] leading-7 text-[#334155]">
            {bio}
          </div>
        </div>
      </div>
    </div>
  );
}