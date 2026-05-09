"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronUp, Pencil, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddFaqModal } from "./_components/AddFaqModal";
import { EditFaqModal } from "./_components/EditFaqModal";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type FAQApiItem = {
  _id: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
};

type FAQApiResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  data: FAQApiItem[];
};

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

export default function FAQManagementPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [localFaqs, setLocalFaqs] = useState<FAQItem[]>([]);
  const [openFaqIds, setOpenFaqIds] = useState<Set<string>>(new Set());
  const [removedFaqIds, setRemovedFaqIds] = useState<Set<string>>(new Set());
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQItem | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FAQItem | null>(null);
  const queryClient = useQueryClient();

  const faqQuery = useQuery<FAQApiResponse>({
    queryKey: ["faqs", token],
    queryFn: async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${apiBase}/faq`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.success === false || data?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to load FAQs.");
      }

      return data;
    },
  });

  const apiFaqs = useMemo<FAQItem[]>(() => {
    return (
      faqQuery.data?.data?.map((item) => ({
        id: item._id,
        question: item.question,
        answer: item.answer,
      })) ?? []
    );
  }, [faqQuery.data]);

  const faqs = useMemo(() => {
    return [...localFaqs, ...apiFaqs].filter(
      (item) => !removedFaqIds.has(item.id)
    );
  }, [apiFaqs, localFaqs, removedFaqIds]);

  useEffect(() => {
    if (apiFaqs.length > 0 && openFaqIds.size === 0) {
      setOpenFaqIds(new Set(apiFaqs.map((item) => item.id)));
    }
  }, [apiFaqs, openFaqIds.size]);

  const handleToggle = (id: string) => {
    setOpenFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = (id: string) => {
    setRemovedFaqIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${apiBase}/faq/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.success === false || data?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to delete FAQ.");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("FAQ deleted successfully.");
      if (deleteTarget) {
        handleDelete(deleteTarget.id);
      }
      queryClient.invalidateQueries({ queryKey: ["faqs", token] });
      setOpenDeleteModal(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete FAQ."
      );
    },
  });

  const handleDeleteOpen = (faq: FAQItem) => {
    setDeleteTarget(faq);
    setOpenDeleteModal(true);
  };

  const handleDeleteClose = (nextOpen: boolean) => {
    setOpenDeleteModal(nextOpen);
    if (!nextOpen) {
      setDeleteTarget(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.id.startsWith("local-")) {
      setLocalFaqs((prev) =>
        prev.filter((item) => item.id !== deleteTarget.id)
      );
      toast.success("FAQ deleted successfully.");
      setOpenDeleteModal(false);
      setDeleteTarget(null);
      return;
    }
    deleteFaqMutation.mutate(deleteTarget.id);
  };

  const handleEditOpen = (faq: FAQItem) => {
    setSelectedFaq(faq);
    setOpenEditModal(true);
  };

  const handleEditClose = () => {
    setOpenEditModal(false);
    setSelectedFaq(null);
  };

  const handleEditUpdated = (updated: FAQItem) => {
    if (updated.id.startsWith("local-")) {
      setLocalFaqs((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    }
    setOpenFaqIds((prev) => {
      const next = new Set(prev);
      next.add(updated.id);
      return next;
    });
  };

  const handleAddFaq = (question: string, answer: string) => {
    const newFaq: FAQItem = {
      id: `local-${Date.now()}`,
      question,
      answer,
    };

    setLocalFaqs((prev) => [newFaq, ...prev]);
    setOpenFaqIds((prev) => new Set(prev).add(newFaq.id));
  };

  return (
    <>
      <div className="min-h-screen bg-[#EEF2F5] px-4 py-5 sm:px-6 lg:px-3">
        <div className="w-full">
          {/* Header */}
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-[20px] font-bold leading-none text-[#2D3D4D] sm:text-[32px]">
                FAQ Management
              </h1>

              <div className="mt-2 flex items-center gap-2 text-[16px] font-medium text-[#2D3D4D]">
                <Link href="/" className="transition hover:text-[#00A56F]">
                  Dashboard
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
                <span>FAQ Management</span>
              </div>
            </div>

            <Button
              onClick={() => setOpenAddModal(true)}
              className="h-[44px] rounded-[6px] bg-[#FBFF26] px-5 text-[14px] font-medium text-[#2D3D4D] hover:bg-[#FBFF26]/95"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Management
            </Button>
          </div>

          {/* FAQ List */}
          <div className="space-y-5">
            {faqQuery.isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="w-full">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="h-6 w-3/4 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
                        <div className="mt-4 space-y-2">
                          <div className="h-4 w-full animate-pulse rounded-[6px] bg-[#F0F3F6]" />
                          <div className="h-4 w-5/6 animate-pulse rounded-[6px] bg-[#F0F3F6]" />
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3 pt-1">
                        <div className="h-8 w-8 animate-pulse rounded-full bg-[#E5E7EB]" />
                        <div className="h-[34px] w-[140px] animate-pulse rounded-full bg-[#E5E7EB]" />
                        <div className="h-8 w-8 animate-pulse rounded-full bg-[#E5E7EB]" />
                      </div>
                    </div>
                  </div>
                ))
              : faqs.map((faq) => {
                  const isOpen = openFaqIds.has(faq.id);
                  return (
                    <div key={faq.id} className="w-full">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggle(faq.id)}
                            className="text-left"
                          >
                            <h2 className="text-[22px] font-bold leading-[1.4] text-[#2D3D4D]">
                              {faq.question}
                            </h2>
                          </button>

                          {isOpen && (
                            <p className="mt-4 text-[16px] leading-7 text-[#2D3D4D]">
                              {faq.answer}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => handleToggle(faq.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#2D3D4D]"
                          >
                            <ChevronUp
                              className={`h-5 w-5 transition-transform ${
                                isOpen ? "rotate-0" : "rotate-180"
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditOpen(faq)}
                            className="inline-flex h-[34px] items-center rounded-full bg-[#00A56F1A] px-4 text-[14px] font-medium text-[#12A150]"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Details
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteOpen(faq)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#F5D64E] transition hover:bg-[#FFF8DB]"
                          >
                            <Trash2 className="h-4 w-4 text-[#FFDE59]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

            {!faqQuery.isLoading && faqs.length === 0 && (
              <div className="rounded-[12px] border border-dashed border-[#CBD5E1] bg-white p-8 text-center">
                <p className="text-[16px] text-[#64748B]">No FAQ added yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddFaqModal
        open={openAddModal}
        onOpenChange={setOpenAddModal}
        onAdd={handleAddFaq}
      />

      <EditFaqModal
        open={openEditModal}
        onOpenChange={handleEditClose}
        faq={selectedFaq}
        onUpdated={handleEditUpdated}
      />

      <Dialog open={openDeleteModal} onOpenChange={handleDeleteClose}>
        <DialogPortal>
          <DialogOverlay className="bg-[#2D3D4DCC]" />

          <DialogContent className="w-[420px] max-w-[92vw] sm:max-w-[92vw] gap-0 rounded-[16px] border-none bg-white p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F7F9] text-[#F5D64E]">
              <Trash2 className="h-6 w-6" />
            </div>

            <DialogTitle className="mt-4 text-[18px] font-semibold text-[#2D3D4D]">
              Are you sure?
            </DialogTitle>
            <p className="mt-2 text-[13px] text-[#64748B]">
              You want to delete {deleteTarget?.question ?? "this FAQ"} from
              this Dashboard.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDeleteClose(false)}
                disabled={deleteFaqMutation.isPending}
                className="h-[40px] rounded-[10px] border border-[#F5D64E] bg-transparent px-6 text-[14px] font-semibold text-[#F5D64E] hover:bg-transparent"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteFaqMutation.isPending}
                className="h-[40px] rounded-[10px] bg-[#FBFF26] px-6 text-[14px] font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deleteFaqMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}
