"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

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
      fullName: combinedName || fullName,
      email: raw.email ?? email,
      phone: raw.phone ?? raw.phoneNumber ?? phone,
      bio: raw.bio ?? raw.about ?? bio,
    };
  }, [profileQuery.data, fullName, email, phone, bio]);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    fullName: profile.fullName,
    phone: profile.phone,
    bio: profile.bio,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: {
      fullName: string;
      phoneNumber: string;
      bio: string;
    }) => {
      if (!token) {
        throw new Error("Missing access token.");
      }
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const formData = new FormData();
      formData.append("fullName", payload.fullName);
      formData.append("phoneNumber", payload.phoneNumber);
      formData.append("bio", payload.bio);

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
      toast.success("Profile updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["user-profile", token] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update profile."
      );
    },
  });

  const handleToggleEdit = () => {
    if (!isEditing) {
      setDraft({
        fullName: profile.fullName,
        phone: profile.phone,
        bio: profile.bio,
      });
      setIsEditing(true);
      return;
    }

    if (!token) {
      toast.error("You must be logged in to update your profile.");
      return;
    }

    updateProfileMutation.mutate({
      fullName: draft.fullName.trim(),
      phoneNumber: draft.phone.trim(),
      bio: draft.bio.trim(),
    });
  };

  useEffect(() => {
    if (!isEditing) {
      setDraft({
        fullName: profile.fullName,
        phone: profile.phone,
        bio: profile.bio,
      });
    }
  }, [isEditing, profile.fullName, profile.phone, profile.bio]);

  const showSkeleton =
    sessionStatus === "loading" || (Boolean(token) && profileQuery.isLoading);

  if (showSkeleton) {
    return (
      <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)] md:p-5">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-5 w-44 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
          <div className="h-[40px] w-[110px] animate-pulse rounded-[8px] bg-[#E5E7EB]" />
        </div>

        <div className="space-y-5">
          <div>
            <div className="mb-2 h-4 w-20 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
            <div className="h-[56px] animate-pulse rounded-[14px] bg-[#F0F3F6]" />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <div className="mb-2 h-4 w-32 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
              <div className="h-[56px] animate-pulse rounded-[14px] bg-[#F0F3F6]" />
            </div>

            <div>
              <div className="mb-2 h-4 w-20 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
              <div className="h-[56px] animate-pulse rounded-[14px] bg-[#F0F3F6]" />
            </div>
          </div>

          <div>
            <div className="mb-2 h-4 w-16 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
            <div className="min-h-[114px] animate-pulse rounded-[14px] bg-[#F0F3F6]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)] md:p-5">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[18px] font-bold text-[#334155]">
          Personal Information
        </h2>

        <Button
          onClick={handleToggleEdit}
          disabled={updateProfileMutation.isPending}
          className="h-[40px] w-full rounded-[8px] bg-[#F5D64E] px-6 text-[15px] font-semibold text-[#334155] hover:bg-[#efcf42] sm:w-auto"
        >
          <Pencil className="mr-2 h-4 w-4" />
          {updateProfileMutation.isPending
            ? "Saving..."
            : isEditing
            ? "Save"
            : "Edit"}
        </Button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-[16px] font-medium text-[#111827]">
            Name
          </label>
          {isEditing ? (
            <Input
              value={draft.fullName}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  fullName: event.target.value,
                }))
              }
              className="h-[56px] rounded-[14px] border-0 bg-[#F0F3F6] px-4 text-[18px] text-[#334155] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
            />
          ) : (
            <div className="rounded-[14px] bg-[#F0F3F6] px-4 py-4 text-[18px] text-[#334155]">
              {profile.fullName}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[16px] font-medium text-[#111827]">
              Email Address
            </label>
            {isEditing ? (
              <Input
                value={profile.email}
                disabled
                className="h-[56px] cursor-not-allowed rounded-[14px] border-0 bg-[#F0F3F6] px-4 text-[18px] text-[#334155] shadow-none"
              />
            ) : (
              <div className="rounded-[14px] bg-[#F0F3F6] px-4 py-4 text-[18px] text-[#334155]">
                {profile.email}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-[16px] font-medium text-[#111827]">
              Phone
            </label>
            {isEditing ? (
              <Input
                value={draft.phone}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
                className="h-[56px] rounded-[14px] border-0 bg-[#F0F3F6] px-4 text-[18px] text-[#334155] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
              />
            ) : (
              <div className="rounded-[14px] bg-[#F0F3F6] px-4 py-4 text-[18px] text-[#334155]">
                {profile.phone}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[16px] font-medium text-[#111827]">
            Bio
          </label>
          {isEditing ? (
            <textarea
              value={draft.bio}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  bio: event.target.value,
                }))
              }
              className="min-h-[114px] w-full rounded-[14px] border-0 bg-[#F0F3F6] px-4 py-4 text-[16px] leading-7 text-[#334155] shadow-none outline-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
            />
          ) : (
            <div className="min-h-[114px] rounded-[14px] bg-[#F0F3F6] px-4 py-4 text-[16px] leading-7 text-[#334155]">
              {profile.bio}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
