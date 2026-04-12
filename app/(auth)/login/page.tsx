"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function YoloHeatLogin() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    const savedPassword = localStorage.getItem("savedPassword");

    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      toast.error("Email is required");
      return;
    }

    if (!trimmedPassword) {
      toast.error("Password is required");
      return;
    }

    try {
      setLoading(true);

      const result = await signIn("credentials", {
        redirect: false,
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (!result) {
        toast.error("Something went wrong. Please try again.");
        return;
      }

      if (result.error) {
        if (result.error === "admin_only") {
          toast.error("Only admin users can sign in.");
        } else {
          toast.error("Invalid email or password");
        }
        return;
      }

      if (rememberMe) {
        localStorage.setItem("savedEmail", trimmedEmail);
        localStorage.setItem("savedPassword", trimmedPassword);
      } else {
        localStorage.removeItem("savedEmail");
        localStorage.removeItem("savedPassword");
      }

      toast.success("User logged in successfully");
      router.replace("/");
    } catch (error) {
      console.error("Login error:", error);
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
              Login to Your Account
            </h2>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b7f86]" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-[50px] rounded-[8px] border-0 bg-[#F5F7F9] pl-9 text-[12px] text-[#4b5563] placeholder:text-[#8a8f98] focus-visible:ring-1 focus-visible:ring-[#d8dde3]"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b7f86]" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-[50px] rounded-[8px] border-0 bg-[#F5F7F9] pl-9 pr-10 text-[12px] text-[#4b5563] placeholder:text-[#8a8f98] focus-visible:ring-1 focus-visible:ring-[#d8dde3]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b7f86]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Bottom row */}
            <div className="flex items-center justify-between pt-1 text-[14px]">
              <label className="flex items-center gap-2 text-[#707782]">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked === true)
                  }
                  className="h-4 w-4 rounded-[3px] border-[#b8bec7]"
                />
                <span>Remember me</span>
              </label>

              <Link
                href="/forgot-password"
                className="font-medium text-[#FFDE59] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Button */}
            <Button
              type="submit"
              disabled={loading}
              className=" h-[50px] w-full rounded-[8px] bg-[#FFDE59] text-[16px] font-semibold text-[#2D3D4D] hover:bg-[#FFDE59]/80 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </div>
    </div>
  );
}
