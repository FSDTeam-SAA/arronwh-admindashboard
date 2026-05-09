"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface AddFaqModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (question: string, answer: string) => void;
}

export function AddFaqModal({
  open,
  onOpenChange,
  onAdd,
}: AddFaqModalProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = session?.accessToken;

  const createFaqMutation = useMutation({
    mutationFn: async (payload: { question: string; answer: string }) => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${apiBase}/faq`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.success === false || data?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to add FAQ.");
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success("FAQ added successfully.");
      const created = data?.data ?? {};
      onAdd(created.question ?? question.trim(), created.answer ?? answer.trim());
      queryClient.invalidateQueries({ queryKey: ["faqs", token] });
      setQuestion("");
      setAnswer("");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to add FAQ."
      );
    },
  });

  const handleSubmit = () => {
    if (!question.trim() || !answer.trim()) return;

    createFaqMutation.mutate({
      question: question.trim(),
      answer: answer.trim(),
    });
  };

  const handleClose = () => {
    if (!createFaqMutation.isPending) {
      setQuestion("");
      setAnswer("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="bg-[#2D3D4DCC]" />

        <DialogContent className="max-h-[92vh] !w-[1000px] max-w-[96vw] sm:max-w-[96vw] gap-0 overflow-hidden rounded-[16px] border-none bg-white p-0 shadow-[0_10px_30px_rgba(15,23,42,0.14)]">
          <div className="px-6 pb-6 pt-7 sm:px-7">
            <div className="mb-6 flex items-start justify-between">
              <DialogTitle className="text-[24px] font-bold text-[#2D3D4D] sm:text-[26px]">
                Add New FAQ
              </DialogTitle>

            
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#2D3D4D]">
                  FAQ Question
                </label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your title..."
                  className="h-[48px] rounded-[10px] border-0 bg-[#F4F7F9] px-4 text-[14px] text-[#2D3D4D] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#d7dfe7]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#2D3D4D]">
                  FAQ Answer
                </label>
                <Input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type FAQ answer..."
                  className="h-[48px] rounded-[10px] border-0 bg-[#F4F7F9] px-4 text-[14px] text-[#2D3D4D] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#d7dfe7]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={createFaqMutation.isPending}
                  className="h-[48px] rounded-[8px] border border-[#F5D64E] bg-transparent text-[14px] font-medium text-[#F5C842] hover:bg-transparent"
                >
                  Not now
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createFaqMutation.isPending}
                  className="h-[48px] rounded-[8px] bg-[#FBFF26] text-[14px] font-medium text-[#2D3D4D] hover:bg-[#FBFF26]/95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {createFaqMutation.isPending ? "Saving..." : "Add"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
