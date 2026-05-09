"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export function ChangePasswordTab() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (!oldPassword || !newPassword) {
        throw new Error("Please fill in all password fields.");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("New password and confirmation do not match.");
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${apiBase}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.status === false || data?.success === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to change password.");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to change password."
      );
    },
  });

  return (
    <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)] md:p-5">
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-[16px] font-medium text-[#334155]">
            Current Password
          </label>
          <div className="relative">
            <Input
              type={showOld ? "text" : "password"}
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              placeholder="Enter current password"
              className="h-[44px] rounded-[8px] border-0 bg-[#EEF2F6] px-4 pr-10 text-[18px] text-[#334155] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
            />
            <button
              type="button"
              onClick={() => setShowOld((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] transition hover:text-[#64748B]"
            >
              {showOld ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[16px] font-medium text-[#334155]">
            New Password
          </label>
          <div className="relative">
            <Input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Enter new password"
              className="h-[44px] rounded-[8px] border-0 bg-[#EEF2F6] px-4 pr-10 text-[18px] text-[#334155] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
            />
            <button
              type="button"
              onClick={() => setShowNew((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] transition hover:text-[#64748B]"
            >
              {showNew ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[16px] font-medium text-[#334155]">
            Confirm New Password
          </label>
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              className="h-[44px] rounded-[8px] border-0 bg-[#EEF2F6] px-4 pr-10 text-[18px] text-[#334155] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] transition hover:text-[#64748B]"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
          <Button
            variant="outline"
            className="h-[42px] rounded-[8px] border border-[#F5D64E] bg-transparent text-[15px] font-semibold text-[#F5D64E] hover:bg-transparent"
          >
            Not Now
          </Button>

          <Button
            onClick={() => changePasswordMutation.mutate()}
            disabled={changePasswordMutation.isPending}
            className="h-[42px] rounded-[8px] bg-[#FBFF26] text-[15px] font-semibold text-[#334155] hover:bg-[#efcf42] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {changePasswordMutation.isPending ? "Saving..." : "Save Change"}
          </Button>
        </div>
      </div>
    </div>
  );
}
