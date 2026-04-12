"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Mail } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error("Email is required");
      return;
    }

    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${apiBase}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json().catch(() => null);
      const message =
        data?.message ??
        (response.ok
          ? "Reset instructions sent to your email."
          : "Something went wrong. Please try again.");

      if (!response.ok || data?.success === false || data?.status === false) {
        toast.error(message);
        return;
      }

      toast.success(message);
      router.push(`/verify-otp?email=${encodeURIComponent(trimmedEmail)}`);
    } catch (error) {
      console.error("Forgot password error:", error);
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
              <Image
                src="/logo.png"
                alt="Yolo Heat"
                width={1000}
                height={100}
                className="mb-3 h-[133px] w-auto object-contain"
              />
            </div>

            <h2 className="mb-6 text-center text-[24px] font-semibold text-[#2D3D4DCC]">
              Forgot Password
            </h2>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b7f86]" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-[50px] rounded-[8px] border-0 bg-[#F5F7F9] pl-9 text-[12px] text-[#4b5563] placeholder:text-[#8a8f98] focus-visible:ring-1 focus-visible:ring-[#d8dde3]"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className=" h-[50px] w-full rounded-[8px] bg-[#FFDE59] text-[16px] font-semibold text-[#2D3D4D] hover:bg-[#FFDE59]/80 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        </CardContent>
      </div>
    </div>
  );
}
