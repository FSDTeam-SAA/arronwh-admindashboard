"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ApiEnvelope<T> = {
  statusCode?: number;
  success?: boolean;
  status?: boolean;
  message?: string;
  data?: T[] | T | null;
};

type FooterManagementItem = {
  _id: string;
  location: string;
  email: string;
  phone: string;
  reviewDescription: string;
  createdAt?: string;
  updatedAt?: string;
};

type FooterFormState = {
  location: string;
  email: string;
  phone: string;
  reviewDescription: string;
};

const INITIAL_FORM_STATE: FooterFormState = {
  location: "",
  email: "",
  phone: "",
  reviewDescription: "",
};

const getApiBase = () =>
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "").replace(
    /\/+$/,
    ""
  );

const getFooterEndpoint = () => {
  const base = getApiBase();
  if (!base) return "/api/v1/footer-management";
  return base.endsWith("/api/v1")
    ? `${base}/footer-management`
    : `${base}/api/v1/footer-management`;
};

const hasExplicitFailure = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return false;
  const parsed = payload as ApiEnvelope<unknown>;
  return parsed.success === false || parsed.status === false;
};

const getApiMessage = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return null;
  const parsed = payload as ApiEnvelope<unknown>;
  return typeof parsed.message === "string" && parsed.message.trim()
    ? parsed.message.trim()
    : null;
};

const readString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const normalizeFooter = (payload: unknown): FooterManagementItem | null => {
  const parsed = payload as ApiEnvelope<unknown>;
  const raw = Array.isArray(parsed?.data) ? parsed.data[0] : parsed?.data;
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Partial<FooterManagementItem>;
  const id = readString(item._id);
  if (!id) return null;

  return {
    _id: id,
    location: readString(item.location),
    email: readString(item.email),
    phone: readString(item.phone),
    reviewDescription: readString(item.reviewDescription),
    createdAt: readString(item.createdAt),
    updatedAt: readString(item.updatedAt),
  };
};



export default function FooterManagementPage() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FooterFormState>(INITIAL_FORM_STATE);

  const footerEndpoint = useMemo(getFooterEndpoint, []);

  const footerQuery = useQuery({
    queryKey: ["footer-management", token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch(footerEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(payload)) {
        throw new Error(getApiMessage(payload) ?? "Failed to load footer data.");
      }

      const footer = normalizeFooter(payload);
      if (!footer) {
        throw new Error("Footer data not found.");
      }

      return footer;
    },
  });

  useEffect(() => {
    if (!footerQuery.data) return;

    setFormData({
      location: footerQuery.data.location,
      email: footerQuery.data.email,
      phone: footerQuery.data.phone,
      reviewDescription: footerQuery.data.reviewDescription,
    });
  }, [footerQuery.data]);

  const updateFooterMutation = useMutation({
    mutationFn: async (payload: FooterFormState) => {
      const footerId = footerQuery.data?._id;
      if (!footerId) {
        throw new Error("Footer ID not found.");
      }

      const response = await fetch(`${footerEndpoint}/${footerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(getApiMessage(result) ?? "Failed to update footer data.");
      }

      return result;
    },
    onSuccess: async (result) => {
      toast.success(getApiMessage(result) ?? "Footer data updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["footer-management", token] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update footer data.");
    },
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    if (!footerQuery.data) return;

    setFormData({
      location: footerQuery.data.location,
      email: footerQuery.data.email,
      phone: footerQuery.data.phone,
      reviewDescription: footerQuery.data.reviewDescription,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !formData.location.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.reviewDescription.trim()
    ) {
      toast.error("Please fill in all footer fields.");
      return;
    }

    updateFooterMutation.mutate({
      location: formData.location.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      reviewDescription: formData.reviewDescription.trim(),
    });
  };

  const isPageLoading =
    status === "loading" || (status === "authenticated" && footerQuery.isLoading);

  if (status === "unauthenticated") {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        Please sign in first to manage footer content.
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded-md bg-slate-200" />
        <div className="w-full">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (footerQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {footerQuery.error instanceof Error ? footerQuery.error.message : "Failed to load footer data."}
      </div>
    );
  }

  const isSubmitDisabled = updateFooterMutation.isPending || !footerQuery.data?._id;

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-xl font-semibold text-[#0F172A]">Footer Section</h2>
        <p className="mt-1 text-sm text-[#64748B]">
          Manage contact information and review text displayed in the website footer.
        </p>
      </div>

      <div className="w-full">
        

        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-[#0F172A]">Edit Footer Information</h3>
            <p className="mt-1 text-sm text-[#64748B]">
              Update the fields and save to publish the footer changes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location" className="text-sm font-medium text-[#0F172A]">
                  Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="h-11"
                  placeholder="123 High Street, London, UK"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#0F172A]">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="h-11"
                  placeholder="support@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-[#0F172A]">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="h-11"
                  placeholder="+44 1234 567890"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reviewDescription" className="text-sm font-medium text-[#0F172A]">
                  Review Description
                </Label>
                <Textarea
                  id="reviewDescription"
                  name="reviewDescription"
                  value={formData.reviewDescription}
                  onChange={handleChange}
                  className="min-h-[130px]"
                  placeholder="See what our customers say about our services."
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="h-11 bg-[#FBFF26] px-8 font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {updateFooterMutation.isPending ? "Saving..." : "Update Footer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={updateFooterMutation.isPending}
                className="h-11 rounded-[4px] border border-[#CBD5E1] px-6 text-[#334155] hover:bg-[#F8FAFC]"
              >
                Reset
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
