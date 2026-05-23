"use client";

import { Suspense, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthLogo } from "@/lib/use-auth-logo";

function OtpVerificationContent() {
  const OTP_LENGTH = 6;
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const { logoSrc, isLogoLoading, handleLogoError } = useAuthLogo();

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const digit = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
        return;
      }

      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;

    event.preventDefault();

    const newOtp = [...otp];
    let lastIndex = 0;

    for (let i = 0; i < OTP_LENGTH; i += 1) {
      const digit = pasted[i] ?? "";
      newOtp[i] = digit;
      if (digit) lastIndex = i;
    }

    setOtp(newOtp);
    inputRefs.current[Math.min(lastIndex + 1, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    const code = otp.join("");

    if (!email) {
      toast.error("Email is missing. Please start over.");
      return;
    }

    if (code.length !== OTP_LENGTH) {
      toast.error("Please enter the full OTP code.");
      return;
    }

    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${apiBase}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: code,
        }),
      });

      const data = await response.json().catch(() => null);
      const message =
        data?.message ??
        (response.ok
          ? "OTP verified successfully."
          : "Something went wrong. Please try again.");

      if (!response.ok || data?.success === false || data?.status === false) {
        toast.error(message);
        return;
      }

      toast.success(message);
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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

            <h2 className="mb-6 text-center text-[24px] font-semibold text-[#2D3D4DCC]">
              OTP Verification
            </h2>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="h-[50px] w-[50px] rounded-[8px] border-0 bg-[#F5F7F9] text-center text-[12px] font-medium text-[#4b5563] outline-none focus:ring-1 focus:ring-[#d8dde3]"
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className=" h-[50px] w-full rounded-[8px] bg-[#FFDE59] text-[16px] font-semibold text-[#2D3D4D] hover:bg-[#FFDE59]/80 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Verifying..." : "Verify Now"}
            </Button>
          </form>
        </CardContent>
      </div>
    </div>
  );
}

function OtpVerificationFallback() {
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

export default function OtpVerificationPage() {
  return (
    <Suspense fallback={<OtpVerificationFallback />}>
      <OtpVerificationContent />
    </Suspense>
  );
}
