"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";

type SendQuoteEmailApiResponse = {
  success?: boolean;
  status?: boolean;
  message?: string;
};

interface SendQuoteEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string | null;
}



function resolveSendEmailEndpoint(): string {
  const apiBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    ""
  ).replace(/\/+$/, "");

  return apiBase
    ? `${apiBase}/subscriber/manuallay-send-email`
    : "/api/v1/subscriber/manuallay-send-email";
}

export function SendQuoteEmailModal({
  open,
  onOpenChange,
  quoteId,
}: SendQuoteEmailModalProps) {
  const [description, setDescription] = useState("");
  const { data: session } = useSession();
  const token = session?.accessToken;

  useEffect(() => {
    if (open) {
      setDescription("");
    }
  }, [open, quoteId]);

  const sendEmailMutation = useMutation({
    mutationFn: async (payload: { quoteId: string; description: string }) => {
      const response = await fetch(resolveSendEmailEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | SendQuoteEmailApiResponse
        | null;
      const hasExplicitFailure =
        data?.success === false || data?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message || "Failed to send email.");
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Email sent successfully.");
      onOpenChange(false);
      setDescription("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to send email."
      );
    },
  });

  const isSubmitDisabled =
    sendEmailMutation.isPending || !quoteId || !description.trim() || !token;

  const handleSubmit = () => {
    if (!token) {
      toast.error("You must be logged in to send email.");
      return;
    }

    if (!quoteId) {
      toast.error("Quote ID not found.");
      return;
    }

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      toast.error("Description is required.");
      return;
    }

    sendEmailMutation.mutate({
      quoteId,
      description: trimmedDescription,
    });
  };

  const handleClose = (nextOpen: boolean) => {
    if (sendEmailMutation.isPending) return;

    onOpenChange(nextOpen);

    if (!nextOpen) {
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="bg-[#2D3D4DCC]" />

        <DialogContent className="max-h-[92vh] !w-[800px] !max-w-[96vw] gap-0 overflow-hidden rounded-[14px] border-none bg-white p-0 shadow-[0_10px_30px_rgba(15,23,42,0.14)]">
          <div className="border-b border-[#EEF2F5] px-5 py-4">
            <DialogTitle className="text-[26px] font-semibold text-[#2D3D4D]">
              Send Follow Up Email
            </DialogTitle>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div>
              <p className="mb-2 text-[14px] font-medium text-[#2D3D4D]">
                Email Description
              </p>
              <Textarea
                rows={6}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Write email description..."
                className="resize-none rounded-[8px] border-[#D9E0E7] bg-white px-3 py-2 text-[14px] text-[#2D3D4D] placeholder:text-[#94A3B8] focus-visible:border-[#D9E0E7] focus-visible:ring-[#FBFF26]"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={sendEmailMutation.isPending}
                className="h-[48px] rounded-[4px] border border-[#F5D64E] bg-transparent text-[15px] font-medium text-[#2D3D4D] hover:bg-transparent"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="h-[48px] rounded-[4px] bg-[#FBFF26] text-[15px] font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sendEmailMutation.isPending ? "Sending..." : "Send email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
