"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  CalendarCheck,
  Wrench,
  ListChecks,
  Package,
  HelpCircle,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const navigation = [
  { name: "Dashboard Overview", href: "/", icon: LayoutDashboard },
  { name: "Quote Generated", href: "/all-product", icon: FileText },
  { name: "Booking Management", href: "/all-treatment", icon: CalendarCheck },
  { name: "Service Management", href: "/benefit-details", icon: Wrench },
  { name: "Quiz Management", href: "/all-users", icon: ListChecks },
  { name: "Controls & Extras Management", href: "/order-history", icon: Package },
  { name: "FAQ Management", href: "/contact-messages", icon: HelpCircle },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Button - শুধু mobile এ এবং sidebar close থাকলে দেখাবে */}
      {!isMobileMenuOpen && (
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-[#212121] text-white shadow-lg hover:bg-[#313131] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "flex h-screen sticky bottom-0 top-0 flex-col bg-white z-50 transition-transform duration-300 overflow-auto border-r border-slate-200",
          "fixed lg:static",
          "w-[240px] sm:w-[250px] lg:w-[300px]",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Header with Logo */}
        <div className="flex flex-col items-center justify-center relative px-6 pt-6 pb-10">
          <div className="flex h-[80px] w-[120px] items-center justify-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={1000}
              height={1000}
              className="object-contain w-full h-full"
            />
          </div>
      

          {/* Close Button - mobile only */}
          {isMobileMenuOpen && (
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden absolute right-3 top-4 p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1.5 px-4 pb-6 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex w-full min-w-0 items-center justify-start gap-3 rounded-[4px] px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#FFDE59] text-slate-900 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                    : "text-slate-800 hover:bg-slate-100",
                )}
              >
                <item.icon
                  className={cn(
                    "h-[38px] w-[18px] transition-colors duration-200 flex-shrink-0",
                    isActive ? "text-slate-900" : "text-slate-700",
                  )}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate font-medium text-[16px] leading-[120%] transition-colors duration-200",
                    isActive ? "text-slate-900" : "text-slate-800",
                  )}
                  title={item.name}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

       
      </div>
    </>
  );
}
