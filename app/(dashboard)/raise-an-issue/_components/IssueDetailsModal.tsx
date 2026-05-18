"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone, Calendar, Copy, Check, MessageSquare } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { IssueItem } from "./raise-an-issue-data-type";

interface IssueDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: IssueItem | null;
}

function formatDateTime(value?: string): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function IssueDetailsModal({
  open,
  onOpenChange,
  issue,
}: IssueDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied successfully.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!issue) return null;

  const initials = issue.name
    ? issue.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "IS";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-[#2D3D4DCC]" />

        <DialogContent className="max-h-[92vh] w-full md:!max-w-[500px] gap-0 overflow-hidden rounded-[16px] border-none bg-white p-0 shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#EEF2F5] px-6 py-5 pr-14">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#00A56F1A] text-[#12A150]">
                <MessageSquare className="h-5 w-5" />
              </div>
              <DialogTitle className="text-[20px] font-bold text-[#2D3D4D]">
                Raise an Issue Details
              </DialogTitle>
            </div>
          </div>

          <div className="max-h-[calc(92vh-78px)] overflow-y-auto p-4 space-y-6">
            {/* User Profile Summary Card */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5 rounded-[12px] bg-[#F8FAFC] border border-[#E5E7EB] p-5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
              {/* Premium Gradient Avatar */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00A56F] to-[#FBFF26] text-[22px] font-extrabold text-[#2D3D4D] shadow-sm select-none">
                {initials}
              </div>

              <div className="space-y-1">
                <h3 className="text-[20px] font-bold text-[#2D3D4D] leading-tight">
                  {issue.name || "Anonymous User"}
                </h3>
                <p className="text-[13px] text-[#64748B] flex items-center gap-1.5 font-medium">
                  <Calendar className="h-4 w-4 shrink-0 text-[#64748B]/80" />
                  <span>Submitted on {formatDateTime(issue.createdAt)}</span>
                </p>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 gap-4">
              {/* Email Address */}
              <div className="rounded-[12px] border border-[#E2E8F0] p-4 space-y-2 bg-white shadow-sm hover:border-[#FBFF26] hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Email Address
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(issue.email, "Email")}
                    className="text-gray-400 hover:text-[#2D3D4D] transition p-0.5"
                    title="Copy Email"
                  >
                    {copiedField === "Email" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 opacity-75 group-hover:opacity-100" />
                    )}
                  </button>
                </div>
                <div className="flex items-start gap-2.5 text-[#2D3D4D]">
                  <Mail className="h-4.5 w-4.5 shrink-0 text-[#12A150] " />
                  <a
                    href={`mailto:${issue.email}`}
                    className="text-[14px] font-bold hover:underline break-all leading-tight mt-1"
                  >
                    {issue.email || "N/A"}
                  </a>
                </div>
              </div>

              {/* Phone Number */}
              <div className="rounded-[12px] border border-[#E2E8F0] p-4 space-y-2 bg-white shadow-sm hover:border-[#FBFF26] hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Phone Number
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(issue.phone, "Phone")}
                    className="text-gray-400 hover:text-[#2D3D4D] transition p-0.5"
                    title="Copy Phone"
                  >
                    {copiedField === "Phone" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 opacity-75 group-hover:opacity-100" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2.5 text-[#2D3D4D]">
                  <Phone className="h-4.5 w-4.5 shrink-0 text-[#12A150]" />
                  <a
                    href={`tel:${issue.phone}`}
                    className="text-[14px] font-bold hover:underline break-all leading-tight"
                  >
                    {issue.phone || "N/A"}
                  </a>
                </div>
              </div>
            </div>

            {/* Message Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#64748B]">
                  Reported Issue Description
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(issue.message, "Message")}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-[#12A150] hover:underline"
                >
                  {copiedField === "Message" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Description
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] p-5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] min-h-[100px]">
                <p className="whitespace-pre-wrap text-[14px] leading-7 text-[#2D3D4D] font-medium">
                  {issue.message || "No description provided."}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {/* <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-center gap-3 border-t border-[#EEF2F5]">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-[44px] rounded-[10px] border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] font-bold text-[14px] w-full sm:w-auto px-5"
              >
                Close Ticket
              </Button>

              {issue.phone && (
                <Button
                  type="button"
                  onClick={() => {
                    window.location.href = `tel:${issue.phone}`;
                  }}
                  className="h-[44px] rounded-[10px] bg-[#00A56F] px-6 text-[14px] font-bold text-white hover:bg-[#009562] w-full sm:w-auto"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call User
                </Button>
              )}

              {issue.email && (
                <Button
                  type="button"
                  onClick={() => {
                    window.location.href = `mailto:${issue.email}`;
                  }}
                  className="h-[44px] rounded-[10px] bg-[#FBFF26] px-6 text-[14px] font-bold text-[#2D3D4D] hover:bg-[#FBFF26]/90 border border-[#F5D64E] w-full sm:w-auto"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              )}
            </div> */}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
