"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { Lock, EyeOff, Check } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthLogo } from "@/lib/use-auth-logo";

function ResetPasswordContent() {
  const REDIRECT_DELAY = 3;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] =
    useState(REDIRECT_DELAY);
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const router = useRouter();
  const { logoSrc, isLogoLoading, handleLogoError } = useAuthLogo();

  useEffect(() => {
    if (!showSuccess) return;

    setRedirectCountdown(REDIRECT_DELAY);

    const interval = window.setInterval(() => {
      setRedirectCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    const timeout = window.setTimeout(() => {
      router.replace("/login");
    }, REDIRECT_DELAY * 1000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [showSuccess, router, REDIRECT_DELAY]);

  const resetPasswordMutation = useMutation({
    mutationFn: async (payload: { email: string; newPassword: string }) => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${apiBase}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      const message =
        data?.message ??
        (response.ok
          ? "Password reset successfully."
          : "Something went wrong. Please try again.");

      if (!response.ok || data?.success === false || data?.status === false) {
        throw new Error(message);
      }

      return { data, message };
    },
    onSuccess: () => {
      setPassword("");
      setConfirmPassword("");
      setShowSuccess(true);
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      toast.error(message);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!email) {
      toast.error("Email is missing. Please start over.");
      return;
    }

    if (!trimmedPassword) {
      toast.error("Password is required");
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      toast.error("Passwords do not match");
      return;
    }

    resetPasswordMutation.mutate({
      email,
      newPassword: trimmedPassword,
    });
  };

  return (
    <div className="min-h-screen w-full  flex items-center justify-center px-4">
      <div className="w-full max-w-[564px] rounded-[18px] !border-none bg-white shadow-sm">
        <CardContent className="px-7 py-8">
          <div className="flex flex-col items-center">
            {/* Logo */}
            <div className="mb-4 flex flex-col items-center">
              {isLogoLoading ? (
                <div className="mb-3 h-[133px] w-[260px] animate-pulse rounded-md bg-slate-200" />
              ) : (
                <Image
                  src={logoSrc}
                  alt="Yolo Heat"
                  width={1000}
                  height={100}
                  className="mb-3 h-[133px] w-auto object-contain"
                  onError={handleLogoError}
                />
              )}
            </div>

            <h2 className="mb-2 text-center text-[24px] font-semibold text-[#2D3D4DCC]">
              Reset Password
            </h2>

            <p className="mb-4 text-center text-[12px] text-[#8a8f98]">
              Enter your new password and confirm password
            </p>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b7f86]" />
              <Input
                type="password"
                placeholder="Create Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-[50px] rounded-[8px] border-0 bg-[#F5F7F9] pl-9 pr-10 text-[12px] text-[#4b5563] placeholder:text-[#8a8f98] focus-visible:ring-1 focus-visible:ring-[#d8dde3]"
              />
              <EyeOff className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b7f86]" />
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b7f86]" />
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-[50px] rounded-[8px] border-0 bg-[#F5F7F9] pl-9 pr-10 text-[12px] text-[#4b5563] placeholder:text-[#8a8f98] focus-visible:ring-1 focus-visible:ring-[#d8dde3]"
              />
              <EyeOff className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b7f86]" />
            </div>

            <Button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className=" h-[50px] w-full rounded-[8px] bg-[#FFDE59] text-[16px] font-semibold text-[#2D3D4D] hover:bg-[#FFDE59]/80 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {resetPasswordMutation.isPending ? "Updating..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F0F3F6] px-4">
          <div className="w-full max-w-[360px] rounded-[16px] bg-white p-6 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFDE59]">
              <Check className="h-7 w-7 text-white" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#2D3D4D]">
              Successful!
            </h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Your password has been updated. Redirecting to login in{" "}
              {redirectCountdown}s.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      <div className="w-full max-w-[564px] rounded-[18px] bg-white shadow-sm">
        <CardContent className="px-7 py-8">
          <p className="text-center text-sm text-[#8a8f98]">Loading...</p>
        </CardContent>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
