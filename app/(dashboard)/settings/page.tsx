"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PersonalInformationTab } from "./_components/PersonalInformationTab";
import { ChangePasswordTab } from "./_components/ChangePasswordTab";
import Image from "next/image";

type Tab = "personal" | "password";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("personal");

  const user = {
    name: "arronwh",
    email: "example@example.com",
    avatar: "/avatar.png",
    fullName: "Olorunmi",
    phone: "(307) 555-0133",
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  };

  return (
    <div className="min-h-screen bg-[#EEF0F3] px-4 py-6 sm:px-6 lg:px-2">
      <div className="w-full">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-[28px] font-bold leading-none text-[#334155]">
            Settings
          </h1>

          <div className="mt-3 flex items-center gap-3 text-[14px] font-medium text-[#334155]">
            <span>Dashboard</span>
            <span className="text-[#64748B]">›</span>
            <span>Settings</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={cn(
              "h-[50px] rounded-[8px] text-[15px] font-semibold transition",
              activeTab === "personal"
                ? "bg-[#F5D64E] text-white"
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
                ? "bg-[#F5D64E] text-white"
                : "bg-white text-[#334155]"
            )}
          >
            Change Password
          </button>
        </div>

        {/* Profile Summary Card */}
        <div className="mb-4 rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-4">
            <Image
              src={user.avatar}
              alt={user.name}
              width={1000}
              height={1000}
              className="h-[56px] w-[56px] rounded-full object-cover"
            />

            <div>
              <h3 className="text-[18px] font-semibold text-[#334155]">
                {user.name}
              </h3>
              <p className="text-[13px] text-[#475569]">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === "personal" ? (
          <PersonalInformationTab
            fullName={user.fullName}
            email={user.email}
            phone={user.phone}
            bio={user.bio}
          />
        ) : (
          <ChangePasswordTab />
        )}
      </div>
    </div>
  );
}