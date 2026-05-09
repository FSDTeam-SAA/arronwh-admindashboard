"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PersonalInformationTab } from "./_components/PersonalInformationTab";
import { ChangePasswordTab } from "./_components/ChangePasswordTab";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Tab = "personal" | "password";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const profileQuery = useQuery({
    queryKey: ["user-profile", token],
    enabled: Boolean(token),
    queryFn: async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${apiBase}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.status === false || data?.success === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to load profile.");
      }

      return data;
    },
  });

  const profile = useMemo(() => {
    const fallbackUser = {
      name: "arronwh",
      email: "example@example.com",
      avatar: "/avatar.png",
      fullName: "Olorunmi",
      phone: "(307) 555-0133",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    };
    const raw =
      profileQuery.data?.data?.user ??
      profileQuery.data?.data ??
      profileQuery.data?.user ??
      profileQuery.data ??
      {};
    const combinedName =
      raw.fullName ??
      raw.name ??
      [raw.firstName, raw.lastName].filter(Boolean).join(" ");

    return {
      fullName: combinedName || fallbackUser.fullName,
      name: raw.name ?? combinedName ?? fallbackUser.name,
      email: raw.email ?? fallbackUser.email,
      phone: raw.phone ?? raw.phoneNumber ?? fallbackUser.phone,
      bio: raw.bio ?? raw.about ?? fallbackUser.bio,
      avatar:
        raw.profilePicture ??
        raw.profileImage ??
        raw.image ??
        fallbackUser.avatar,
    };
  }, [profileQuery.data]);

  const updateProfileMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!token) {
        throw new Error("Missing access token.");
      }
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await fetch(`${apiBase}/user/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.status === false || data?.success === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to update profile.");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Profile image updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["user-profile", token] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update profile."
      );
    },
  });

  const handleEditClick = () => {
    if (!token) {
      toast.error("You must be logged in to update the profile image.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    updateProfileMutation.mutate(file);
    event.target.value = "";
  };

  const showProfileSkeleton =
    sessionStatus === "loading" || (Boolean(token) && profileQuery.isLoading);

  return (
    <div className="min-h-screen bg-[#EEF0F3] px-4 py-6 sm:px-6 lg:px-2">
      <div className="w-full">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-[28px] font-bold leading-none text-[#2D3D4D]">
            Settings
          </h1>

          <div className="mt-2 flex items-center gap-2 text-[16px] font-medium text-[#2D3D4D]">
            <Link href="/" className="transition hover:text-[#00A56F]">
              Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
            <span>Settings</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={cn(
              "h-[50px] rounded-[8px] text-[18px] font-semibold transition",
              activeTab === "personal"
                ? "bg-[#FBFF26] text-white"
                : "bg-white text-[#334155]"
            )}
          >
            Personal Information
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("password")}
            className={cn(
              "h-[50px] rounded-[8px] text-[15px] font-semibold transition",
              activeTab === "password"
                ? "bg-[#FBFF26] text-white"
                : "bg-white text-[#334155]"
            )}
          >
            Change Password
          </button>
        </div>

        {/* Profile Summary Card */}
        <div className="mb-4 rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          {showProfileSkeleton ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-[56px] w-[56px] animate-pulse rounded-full bg-[#E5E7EB]" />
                <div>
                  <div className="h-4 w-32 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
                  <div className="mt-2 h-3 w-44 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
                </div>
              </div>
              <div className="h-[40px] w-[110px] animate-pulse rounded-[8px] bg-[#E5E7EB]" />
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Image
                  src={profile.avatar || "/avatar.png"}
                  alt={profile.name}
                  width={1000}
                  height={1000}
                  className="h-[80px] w-[80px] rounded-full object-cover"
                />

                <div>
                  <h3 className="text-[18px] font-semibold text-[#2D3D4D]">
                    {profile.name}
                  </h3>
                  <p className="text-[14px] text-[#2D3D4D]">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={handleEditClick}
                  disabled={updateProfileMutation.isPending}
                  className="h-[40px] rounded-[8px] bg-[#FBFF26] px-5 text-[14px] font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {updateProfileMutation.isPending ? "Uploading..." : "Edit"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {activeTab === "personal" ? (
          <PersonalInformationTab
            fullName={profile.fullName}
            email={profile.email}
            phone={profile.phone}
            bio={profile.bio}
          />
        ) : (
          <ChangePasswordTab />
        )}
      </div>
    </div>
  );
}
