"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChangePasswordTab() {
  return (
    <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)] md:p-5">
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-[16px] font-medium text-[#334155]">
            Current Password
          </label>
          <Input
            type="password"
            defaultValue="**************"
            className="h-[44px] rounded-[8px] border-0 bg-[#EEF2F6] px-4 text-[18px] text-[#334155] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
          />
        </div>

        <div>
          <label className="mb-2 block text-[16px] font-medium text-[#334155]">
            New Password
          </label>
          <Input
            type="password"
            defaultValue="**************"
            className="h-[44px] rounded-[8px] border-0 bg-[#EEF2F6] px-4 text-[18px] text-[#334155] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
          />
        </div>

        <div>
          <label className="mb-2 block text-[16px] font-medium text-[#334155]">
            Confirm New Password
          </label>
          <Input
            type="password"
            defaultValue="**************"
            className="h-[44px] rounded-[8px] border-0 bg-[#EEF2F6] px-4 text-[18px] text-[#334155] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
          <Button
            variant="outline"
            className="h-[42px] rounded-[8px] border border-[#F5D64E] bg-transparent text-[15px] font-semibold text-[#F5D64E] hover:bg-transparent"
          >
            Not Now
          </Button>

          <Button className="h-[42px] rounded-[8px] bg-[#F5D64E] text-[15px] font-semibold text-[#334155] hover:bg-[#efcf42]">
            Save Change
          </Button>
        </div>
      </div>
    </div>
  );
}