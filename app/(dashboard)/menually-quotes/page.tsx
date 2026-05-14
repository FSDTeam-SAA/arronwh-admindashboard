'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Eye, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { useManualQuoteStore } from './_store/useManualQuoteStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomPagination } from "@/components/ui/common/CustomPagination";

type InvoiceCustomerInfo = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  postcode?: string;
};

type InvoiceItem = {
  _id: string;
  id?: string;
  quoteId?: unknown;
  customerInfo?: InvoiceCustomerInfo;
  status?: string;
  createdAt?: string;
  totalAmount?: number;
  total?: number;
  grandTotal?: number;
  vatRate?: number;
  dueDate?: string;
  deliveryDate?: string;
  notes?: string;
  boilers?: Array<{
    name?: string;
    numberOfBoiler?: number;
    price?: number;
  }>;
  controllers?: Array<{
    name?: string;
    numberOfControllers?: number;
    price?: number;
  }>;
  extras?: Array<{
    name?: string;
    numberOfExtra?: number;
    price?: number;
  }>;
};

type ApiResponse = {
  success?: boolean;
  status?: boolean;
  statusCode?: number;
  message?: string;
  data?: unknown;
};

type ManualQuoteFormProps = {
  onBack: () => void;
};

const generateQuoteId = () =>
  `MQ-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

const normalizePostcode = (value: string) =>
  value.toUpperCase().replace(/\s+/g, ' ').trim();

const getApiBase = () => (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

const resolvePostcodeLookupEndpoint = (postcode: string) => {
  const encodedPostcode = encodeURIComponent(postcode);
  const apiBase = getApiBase();

  if (!apiBase) {
    return `/api/v1/postcode/${encodedPostcode}/addresses`;
  }

  return apiBase.endsWith('/api/v1')
    ? `${apiBase}/postcode/${encodedPostcode}/addresses`
    : `${apiBase}/api/v1/postcode/${encodedPostcode}/addresses`;
};

const resolveInvoiceCollectionEndpoint = () => {
  const apiBase = getApiBase();

  if (!apiBase) {
    return '/api/v1/invoice';
  }

  return apiBase.endsWith('/api/v1')
    ? `${apiBase}/invoice`
    : `${apiBase}/api/v1/invoice`;
};

const resolveInvoiceDeleteEndpoint = (id: string) =>
  `${resolveInvoiceCollectionEndpoint()}/${id}`;

const resolveInvoiceListEndpoint = (page: number, limit: number) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return `${resolveInvoiceCollectionEndpoint()}?${params.toString()}`;
};

const buildAddressFromObject = (record: Record<string, unknown>) => {
  const directKeys = [
    'fullAddress',
    'full_address',
    'address',
    'formattedAddress',
    'formatted_address',
    'displayAddress',
  ];

  for (const key of directKeys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  const parts = [
    record.addressLine1,
    record.addressLine2,
    record.line1,
    record.line2,
    record.street,
    record.town,
    record.city,
    record.postTown,
    record.postcode,
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim());

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return '';
};

const extractAddressOptions = (payload: unknown) => {
  const payloadRecord =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : null;

  const possibleLists: unknown[] = [
    payloadRecord?.data && typeof payloadRecord.data === 'object'
      ? (payloadRecord.data as Record<string, unknown>).addresses
      : undefined,
    payloadRecord?.data,
    payloadRecord?.addresses,
    payloadRecord?.results,
    payload,
  ];

  for (const list of possibleLists) {
    if (!Array.isArray(list)) {
      continue;
    }

    const normalized = list
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim();
        }

        if (item && typeof item === 'object') {
          return buildAddressFromObject(item as Record<string, unknown>);
        }

        return '';
      })
      .filter(Boolean);

    if (normalized.length > 0) {
      return Array.from(new Set(normalized));
    }
  }

  return [] as string[];
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const normalizeInvoiceArray = (value: unknown): InvoiceItem[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) return null;

      const recordId =
        typeof record._id === 'string'
          ? record._id
          : typeof record.id === 'string'
            ? record.id
            : `row-${index}`;

      return {
        ...(record as unknown as InvoiceItem),
        _id: recordId,
      };
    })
    .filter((item): item is InvoiceItem => item !== null);
};

const extractInvoices = (payload: unknown): InvoiceItem[] => {
  const directArray = normalizeInvoiceArray(payload);
  if (directArray.length > 0) return directArray;

  const record = asRecord(payload);
  if (!record) return [];

  const dataRecord = asRecord(record.data);

  const candidates: unknown[] = [
    dataRecord?.data,
    dataRecord?.invoices,
    record.data,
    record.invoices,
    record.results,
    record.items,
  ];

  for (const candidate of candidates) {
    const list = normalizeInvoiceArray(candidate);
    if (list.length > 0) return list;
  }

  return [];
};

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
  return `£${value.toLocaleString('en-GB')}`;
};

const MANUAL_QUOTES_PAGE_SIZE = 10;

const getQuoteReference = (invoice: InvoiceItem) => {
  if (typeof invoice.quoteId === 'string' && invoice.quoteId.trim()) {
    return invoice.quoteId;
  }

  if (invoice.quoteId && typeof invoice.quoteId === 'object') {
    const record = invoice.quoteId as Record<string, unknown>;
    const nestedId =
      (typeof record.quoteId === 'string' && record.quoteId) ||
      (typeof record._id === 'string' && record._id) ||
      (typeof record.id === 'string' && record.id) ||
      '';

    if (nestedId) return nestedId;
  }

  return invoice._id;
};

const ManualQuoteForm = ({ onBack }: ManualQuoteFormProps) => {
  const router = useRouter();
  const setFormDataToStore = useManualQuoteStore((state) => state.setFormData);

  const [isTitleOpen, setIsTitleOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    email: '',
    address: '',
    postcode: '',
    mobileNumber: '',
  });

  const [marketingConsent, setMarketingConsent] = useState(false);
  const [addressOptions, setAddressOptions] = useState<string[]>([]);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [postcodeMessage, setPostcodeMessage] = useState('');
  const [postcodeError, setPostcodeError] = useState('');

  const titles = ["Mr", "Mrs", "Ms", "Dr"];

  useEffect(() => {
    const normalizedPostcode = normalizePostcode(formData.postcode);

    if (!normalizedPostcode) {
      setAddressOptions([]);
      setPostcodeError('');
      setPostcodeMessage('');
      setIsAddressDropdownOpen(false);
      setIsAddressLoading(false);
      return;
    }

    setPostcodeError('');
    setPostcodeMessage('');
    setIsAddressLoading(true);

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          resolvePostcodeLookupEndpoint(normalizedPostcode),
          { signal: controller.signal },
        );
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            result &&
            typeof result === 'object' &&
            'message' in result &&
            typeof (result as { message?: unknown }).message === 'string'
              ? ((result as { message: string }).message || 'Failed to fetch postcode addresses.')
              : 'Failed to fetch postcode addresses.';
          throw new Error(message);
        }

        const addresses = extractAddressOptions(result);
        setAddressOptions(addresses);

        if (addresses.length === 0) {
          setIsAddressDropdownOpen(false);
          setPostcodeMessage('No addresses found for this postcode.');
        } else {
          setIsAddressDropdownOpen(true);
          setPostcodeMessage(`${addresses.length} location(s) found. Please select one.`);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setAddressOptions([]);
        setIsAddressDropdownOpen(false);
        setPostcodeMessage('');
        setPostcodeError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch postcode addresses.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsAddressLoading(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.postcode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTitle) {
      alert("Please select a title");
      return;
    }

    if (!formData.firstName || !formData.surname || !formData.email || !formData.address || !formData.postcode) {
      alert("Please fill all required fields");
      return;
    }

    setFormDataToStore({
      quoteId: generateQuoteId(),
      title: selectedTitle,
      firstName: formData.firstName.trim(),
      surname: formData.surname.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      postcode: normalizePostcode(formData.postcode),
      mobileNumber: formData.mobileNumber.trim(),
      marketingConsent,
    });

    router.push('/menually-quotes/invoice');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'postcode') {
      const postcodeValue = value.toUpperCase();
      setFormData((prev) => ({
        ...prev,
        postcode: postcodeValue,
        address: '',
      }));
      setAddressOptions([]);
      setIsAddressDropdownOpen(false);
      setPostcodeMessage('');
      setPostcodeError('');
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[20px] font-semibold text-[#2D3D4D]">Create Manual Quote</h2>
        <button
          type="button"
          onClick={onBack}
          className="rounded-[8px] border border-[#D5DCE3] px-4 py-2 text-sm font-medium text-[#2D3D4D] hover:bg-[#F7FAFC]"
        >
          Back To List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4 md:space-y-5">
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-4 md:col-span-4 space-y-1">
            <label className="block text-base md:text-[17px] font-medium text-[#2D3D4D]">
              Title <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTitleOpen((prev) => !prev)}
                className="flex h-12 w-full items-center justify-between border-b border-[#2D3D4D] bg-[#FFFFFF] px-4 text-left text-base text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <span>{selectedTitle || 'Choose'}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-[#2D3D4D] transition-transform",
                    isTitleOpen && "rotate-180"
                  )}
                />
              </button>

              {isTitleOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-[#D5DCE3] bg-white shadow-lg">
                  {titles.map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => {
                        setSelectedTitle(title);
                        setIsTitleOpen(false);
                      }}
                      className="block w-full px-4 py-3 text-left text-base text-[#2D3D4D] hover:bg-[#F0F4F8]"
                    >
                      {title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-8 md:col-span-4 space-y-1">
            <label className="block text-base md:text-[17px] font-medium text-[#2D3D4D]">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Enter your first name"
              className="h-12 w-full rounded-none border-b border-[#2D3D4D] bg-[#FFFFFF] px-4 text-base text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="col-span-12 md:col-span-4 space-y-1">
            <label className="block text-base md:text-[17px] font-medium text-[#2D3D4D]">
              Surname <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleInputChange}
              placeholder="Enter your surname"
              className="h-12 w-full rounded-none border-b border-[#2D3D4D] bg-[#FFFFFF] px-4 text-base text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-base md:text-[17px] font-medium text-[#2D3D4D]">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            className="h-12 w-full rounded-none border-b border-[#2D3D4D] bg-[#FFFFFF] px-4 text-base text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-base md:text-[17px] font-medium text-[#2D3D4D]">
            Postcode <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="postcode"
            value={formData.postcode}
            onChange={handleInputChange}
            placeholder="e.g. SW1A 1AA"
            className="h-12 w-full rounded-none border-b border-[#2D3D4D] bg-[#FFFFFF] px-4 text-base text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
          {isAddressLoading && (
            <p className="text-[13px] text-[#58616B]">Looking up addresses...</p>
          )}
          {!!postcodeError && (
            <p className="text-[13px] text-red-500">{postcodeError}</p>
          )}
          {!postcodeError && !!postcodeMessage && (
            <p className="text-[13px] text-[#58616B]">{postcodeMessage}</p>
          )}

          {addressOptions.length > 0 && (
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => setIsAddressDropdownOpen((prev) => !prev)}
                className="flex h-12 w-full items-center justify-between border-b border-[#2D3D4D] bg-[#FFFFFF] px-4 text-left text-base text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <span className={cn(!formData.address && 'text-[#7D8A98]')}>
                  {formData.address || 'Select location from this postcode'}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-[#2D3D4D] transition-transform",
                    isAddressDropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {isAddressDropdownOpen && (
                <div className="absolute left-0 top-full z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-[#D5DCE3] bg-white shadow-lg">
                  {addressOptions.map((address) => (
                    <button
                      key={address}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, address }));
                        setIsAddressDropdownOpen(false);
                      }}
                      className={cn(
                        "block w-full px-4 py-3 text-left text-sm hover:bg-[#F0F4F8]",
                        formData.address === address ? "bg-[#F7FAFC] text-[#2D3D4D] font-medium" : "text-[#2D3D4D]",
                      )}
                    >
                      {address}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-base md:text-[17px] font-medium text-[#2D3D4D]">
            Mobile Number (optional)
          </label>
          <div className="flex h-14 items-center gap-3 bg-[#E9EEF3] px-2 w-full overflow-hidden">
            <input
              type="tel"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleInputChange}
              placeholder="e.g. 07700 900000"
              className="h-full flex-1 min-w-0 bg-white px-2 text-base text-[#2D3D4D] placeholder:text-[#7D8A98] focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 md:pt-1">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-[2px] shrink-0 md:mt-1">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-[4px] border border-[#2D3D4D] bg-white checked:bg-primary checked:border-primary focus:outline-none"
              />
              <svg
                className="absolute left-1 top-1 h-3 w-3 text-[#2D3D4D] opacity-0 peer-checked:opacity-100 pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-[13px] md:text-[14px] font-normal leading-relaxed md:leading-normal text-[#2D3D4D]">
              I’m happy to receive an email with my installation quote from YOLO HEAT.
            </span>
          </label>
        </div>

        <div className="flex justify-end pt-2 md:pt-0">
          <button
            type="submit"
            className="h-12 w-full md:w-auto md:min-w-[160px] rounded-[8px] bg-[#FBFF26] px-8 text-base font-bold text-[#2D3D4D] transition-all hover:bg-[#FBFF26]/90 active:scale-95 disabled:opacity-70"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default function ManualQuotesPage() {
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceItem | null>(null);

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setActionMessage('');

    try {
      const response = await fetch(resolveInvoiceListEndpoint(page, MANUAL_QUOTES_PAGE_SIZE), {
        method: 'GET',
        cache: 'no-store',
      });

      const result = (await response.json().catch(() => null)) as ApiResponse | null;
      const hasExplicitFailure = result?.success === false || result?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(result?.message || 'Failed to load invoices.');
      }

      const rows = extractInvoices(result?.data ?? result);
      const payloadRecord = asRecord(result?.data ?? result);
      const nestedPayloadRecord = asRecord(payloadRecord?.data);
      const total =
        asNumber(nestedPayloadRecord?.total) ??
        asNumber(payloadRecord?.total) ??
        rows.length;

      setInvoices(rows);
      setTotalItems(Math.max(0, Math.floor(total)));
    } catch (loadError) {
      setInvoices([]);
      setTotalItems(0);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load manual quote list.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (!isCreateMode) {
      void loadInvoices();
    }
  }, [isCreateMode, loadInvoices]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id;

    setDeletingId(id);
    setActionMessage('');
    setError('');

    try {
      const response = await fetch(resolveInvoiceDeleteEndpoint(id), {
        method: 'DELETE',
      });

      const result = (await response.json().catch(() => null)) as ApiResponse | null;
      const hasExplicitFailure = result?.success === false || result?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(result?.message || 'Failed to delete invoice.');
      }

      setInvoices((prev) => prev.filter((item) => item._id !== id));
      setTotalItems((prev) => Math.max(0, prev - 1));
      setActionMessage('Invoice deleted successfully.');
      setIsDeleteOpen(false);
      setDeleteTarget(null);

      const isLastItemOnPage = invoices.length === 1;
      if (isLastItemOnPage && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete invoice.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / MANUAL_QUOTES_PAGE_SIZE));
  const startItem = totalItems === 0 ? 0 : (page - 1) * MANUAL_QUOTES_PAGE_SIZE + 1;
  const endItem = Math.min(page * MANUAL_QUOTES_PAGE_SIZE, totalItems);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleOpenDetails = (invoice: InvoiceItem) => {
    setSelectedInvoice(invoice);
    setIsDetailsOpen(true);
  };

  const handleDetailsOpenChange = (nextOpen: boolean) => {
    setIsDetailsOpen(nextOpen);
    if (!nextOpen) {
      setSelectedInvoice(null);
    }
  };

  const handleOpenDelete = (invoice: InvoiceItem) => {
    setDeleteTarget(invoice);
    setIsDeleteOpen(true);
  };

  const handleDeleteOpenChange = (nextOpen: boolean) => {
    setIsDeleteOpen(nextOpen);
    if (!nextOpen) {
      setDeleteTarget(null);
    }
  };

  const totalQuotesLabel = useMemo(
    () => `${totalItems} manual quote${totalItems === 1 ? '' : 's'}`,
    [totalItems]
  );

  const selectedCustomerInfo = selectedInvoice?.customerInfo ?? {};
  const selectedFullAddress = [selectedCustomerInfo.address, selectedCustomerInfo.postcode]
    .filter((part): part is string => !!part && part.trim().length > 0)
    .join(', ');
  const selectedTotalValue =
    typeof selectedInvoice?.totalAmount === 'number'
      ? selectedInvoice.totalAmount
      : typeof selectedInvoice?.grandTotal === 'number'
        ? selectedInvoice.grandTotal
        : typeof selectedInvoice?.total === 'number'
          ? selectedInvoice.total
          : undefined;
  const deleteLabel = deleteTarget ? getQuoteReference(deleteTarget) : 'this invoice';

  if (isCreateMode) {
    return (
      <div className="min-h-screen bg-[#EEF2F5] px-4 py-5 sm:px-6 lg:px-3">
        <div className="w-full">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-bold leading-none text-[#2D3D4D] sm:text-[32px]">
                Manual Quote Management
              </h1>
              <div className="mt-2 flex items-center gap-2 text-[16px] font-medium text-[#2D3D4D]">
                <Link href="/" className="transition hover:text-[#00A56F]">
                  Dashboard
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
                <span>Manual Quote Management</span>
              </div>
            </div>
          </div>

          <ManualQuoteForm onBack={() => setIsCreateMode(false)} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#EEF2F5] px-4 py-5 sm:px-6 lg:px-3">
        <div className="w-full">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-bold leading-none text-[#2D3D4D] sm:text-[32px]">
              Manual Quote Management
            </h1>

            <div className="mt-2 flex items-center gap-2 text-[16px] font-medium text-[#2D3D4D]">
              <Link href="/" className="transition hover:text-[#00A56F]">
                Dashboard
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
              <span>Manual Quote Management</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateMode(true)}
            className="inline-flex h-[48px] items-center gap-2 rounded-[8px] bg-[#FBFF26] px-5 text-lg font-medium text-[#2D3D4D] hover:bg-[#FBFF26]/95"
          >
            <Plus className="h-5 w-5" />
            Create Manual Quote
          </button>
        </div>

        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.04)] sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-[#5E6B78]">
              {isLoading ? 'Loading manual quotes...' : `Showing ${totalQuotesLabel}`}
            </p>
            <button
              type="button"
              onClick={() => void loadInvoices()}
              className="inline-flex items-center gap-2 rounded-[8px] border border-[#D5DCE3] px-3 py-2 text-sm font-medium text-[#2D3D4D] hover:bg-[#F7FAFC]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {!!error && (
            <div className="mb-3 rounded-md border border-[#E6BAC0] bg-[#FFF4F5] px-4 py-3 text-sm text-[#C0392B]">
              {error}
            </div>
          )}

          {!!actionMessage && (
            <div className="mb-3 rounded-md border border-[#BFE3C3] bg-[#EEFDF0] px-4 py-3 text-sm text-[#216E39]">
              {actionMessage}
            </div>
          )}

          <div className="overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow className="border-none bg-[#F4F7F9] hover:bg-[#F4F7F9]">
                
                  <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                    Customer Name
                  </TableHead>
                  <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                    Email
                  </TableHead>
                  <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                    Address
                  </TableHead>
               
                  <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                    Created
                  </TableHead>
                  <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                    Total
                  </TableHead>
                  <TableHead className="h-[42px] rounded-r-[8px] px-4 text-right text-[16px] font-medium text-[#00A56F]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`} className="border-b border-[#EDF1F4]">
                      {Array.from({ length: 8 }).map((__, cellIndex) => (
                        <TableCell key={`cell-${cellIndex}`} className="px-4 py-[14px]">
                          <div className="h-5 w-full animate-pulse rounded-md bg-gray-200" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-[#64748B]"
                    >
                      No manual quotes found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => {
                    const customerInfo = invoice.customerInfo ?? {};
                    const fullAddress = [customerInfo.address, customerInfo.postcode]
                      .filter((part): part is string => !!part && part.trim().length > 0)
                      .join(', ');
                    const totalValue =
                      typeof invoice.totalAmount === 'number'
                        ? invoice.totalAmount
                        : typeof invoice.grandTotal === 'number'
                          ? invoice.grandTotal
                          : typeof invoice.total === 'number'
                            ? invoice.total
                            : undefined;

                    return (
                      <TableRow
                        key={invoice._id}
                        className="border-b border-[#EDF1F4] hover:bg-transparent"
                      >
                     
                        <TableCell className="px-4 py-[14px] text-[15px] font-medium text-[#2D3D4D]">
                          {customerInfo.name || 'N/A'}
                        </TableCell>
                        <TableCell className="px-4 py-[14px] text-[15px] font-medium text-[#2D3D4D]">
                          {customerInfo.email || 'N/A'}
                        </TableCell>
                          <TableCell className="px-4 py-[14px] text-[15px] font-medium text-[#2D3D4D]">
                            <p
                              className="max-w-[220px] truncate"
                              title={fullAddress || 'N/A'}
                            >
                              {fullAddress || 'N/A'}
                            </p>
                          </TableCell>
                      
                        <TableCell className="px-4 py-[14px] text-[15px] font-medium text-[#2D3D4D]">
                          {formatDate(invoice.createdAt)}
                        </TableCell>
                        <TableCell className="px-4 py-[14px] text-[15px] font-medium text-[#2D3D4D]">
                          {formatCurrency(totalValue)}
                        </TableCell>
                          <TableCell className="px-4 py-[14px]">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleOpenDetails(invoice)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#00A56F] transition hover:bg-[#DCF4E7]"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(invoice)}
                              disabled={deletingId === invoice._id}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#F5D64E] transition hover:bg-[#FFF8DB] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="!h-5 !w-5 text-[#FFDE59]" />
                            </button>
                            </div>
                          </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] font-medium text-[#64748B]">
              Showing {startItem} to {endItem} of {totalItems} results
            </p>

            <CustomPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={handleDetailsOpenChange}>
        <DialogContent className="!max-w-[66vw] max-h-[88vh] bg-white overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#2D3D4D]">
              Manual Quote Details
            </DialogTitle>
          </DialogHeader> 

          {selectedInvoice ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-[#F7FAFC] p-3">
                  <p className="text-xs text-[#5E6B78]">Quote Ref</p>
                  <p className="text-sm font-semibold text-[#2D3D4D]">
                    {getQuoteReference(selectedInvoice)}
                  </p>
                </div>
                <div className="rounded-md bg-[#F7FAFC] p-3">
                  <p className="text-xs text-[#5E6B78]">Status</p>
                  <p className="text-sm font-semibold capitalize text-[#2D3D4D]">
                    {selectedInvoice.status || 'pending'}
                  </p>
                </div>
                <div className="rounded-md bg-[#F7FAFC] p-3">
                  <p className="text-xs text-[#5E6B78]">Customer Name</p>
                  <p className="text-sm font-semibold text-[#2D3D4D]">
                    {selectedCustomerInfo.name || 'N/A'}
                  </p>
                </div>
                <div className="rounded-md bg-[#F7FAFC] p-3">
                  <p className="text-xs text-[#5E6B78]">Email</p>
                  <p className="text-sm font-semibold text-[#2D3D4D]">
                    {selectedCustomerInfo.email || 'N/A'}
                  </p>
                </div>
                <div className="rounded-md bg-[#F7FAFC] p-3">
                  <p className="text-xs text-[#5E6B78]">Phone</p>
                  <p className="text-sm font-semibold text-[#2D3D4D]">
                    {selectedCustomerInfo.phone || 'N/A'}
                  </p>
                </div>
                <div className="rounded-md bg-[#F7FAFC] p-3">
                  <p className="text-xs text-[#5E6B78]">Created</p>
                  <p className="text-sm font-semibold text-[#2D3D4D]">
                    {formatDate(selectedInvoice.createdAt)}
                  </p>
                </div>
                <div className="rounded-md bg-[#F7FAFC] p-3 sm:col-span-2">
                  <p className="text-xs text-[#5E6B78]">Full Address</p>
                  <p className="text-sm font-semibold text-[#2D3D4D] break-words">
                    {selectedFullAddress || 'N/A'}
                  </p>
                </div>
                <div className="rounded-md bg-[#F7FAFC] p-3">
                  <p className="text-xs text-[#5E6B78]">Total</p>
                  <p className="text-sm font-semibold text-[#2D3D4D]">
                    {formatCurrency(selectedTotalValue)}
                  </p>
                </div>
                <div className="rounded-md bg-[#F7FAFC] p-3">
                  <p className="text-xs text-[#5E6B78]">VAT Rate</p>
                  <p className="text-sm font-semibold text-[#2D3D4D]">
                    {typeof selectedInvoice.vatRate === 'number'
                      ? `${selectedInvoice.vatRate}%`
                      : 'N/A'}
                  </p>
                </div>
                <div className="rounded-md bg-[#F7FAFC] p-3">
                  <p className="text-xs text-[#5E6B78]">Due Date</p>
                  <p className="text-sm font-semibold text-[#2D3D4D]">
                    {selectedInvoice.dueDate || 'N/A'}
                  </p>
                </div>
                <div className="rounded-md bg-[#F7FAFC] p-3">
                  <p className="text-xs text-[#5E6B78]">Delivery Date</p>
                  <p className="text-sm font-semibold text-[#2D3D4D]">
                    {selectedInvoice.deliveryDate || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="rounded-md bg-[#F7FAFC] p-3">
                <p className="text-xs text-[#5E6B78]">Notes</p>
                <p className="mt-1 text-sm font-medium text-[#2D3D4D] whitespace-pre-wrap break-words">
                  {selectedInvoice.notes || 'N/A'}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md bg-[#F7FAFC] p-3">
                  <p className="mb-2 text-xs font-medium text-[#5E6B78]">Boilers </p>
                  {Array.isArray(selectedInvoice.boilers) && selectedInvoice.boilers.length > 0 ? (
                    <div className="space-y-2">
                      {selectedInvoice.boilers.map((item, index) => (
                        <div key={`boiler-${index}`} className="text-xs text-[#2D3D4D]">
                          <p className="font-medium">{item.name || 'N/A'}</p>
                         <p>Qty: {item.numberOfBoiler || 'N/A'}</p>
                          <p>Price: {formatCurrency(item.price)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#5E6B78]">No boiler items</p>
                  )}
                </div>
                <div className="rounded-md bg-[#F7FAFC] p-3">
                  <p className="mb-2 text-xs font-medium text-[#5E6B78]">Controllers</p>
                  {Array.isArray(selectedInvoice.controllers) && selectedInvoice.controllers.length > 0 ? (
                    <div className="space-y-2">
                      {selectedInvoice.controllers.map((item, index) => (
                        <div key={`controller-${index}`} className="text-xs text-[#2D3D4D]">
                          <p className="font-medium">{item.name || 'N/A'}</p>
                          <p>Qty: {item.numberOfControllers ?? 0}</p>
                          <p>Price: {formatCurrency(item.price)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#5E6B78]">No controller items</p>
                  )}
                </div>
                <div className="rounded-md bg-[#F7FAFC] p-3">
                  <p className="mb-2 text-xs font-medium text-[#5E6B78]">Extras</p>
                  {Array.isArray(selectedInvoice.extras) && selectedInvoice.extras.length > 0 ? (
                    <div className="space-y-2">
                      {selectedInvoice.extras.map((item, index) => (
                        <div key={`extra-${index}`} className="text-xs text-[#2D3D4D]">
                          <p className="font-medium">{item.name || 'N/A'}</p>
                          <p>Qty: {item.numberOfExtra ?? 0}</p>
                          <p>Price: {formatCurrency(item.price)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#5E6B78]">No extra items</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={handleDeleteOpenChange}>
        <DialogContent className="max-w-[420px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#2D3D4D]">
              Confirm Delete
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-[#5E6B78]">
            Are you sure you want to delete <span className="font-semibold text-[#2D3D4D]">{deleteLabel}</span>?
          </p>

          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => handleDeleteOpenChange(false)}
              disabled={!!deletingId}
              className="h-10 rounded-[8px] border border-[#D5DCE3] px-4 text-sm font-medium text-[#2D3D4D] hover:bg-[#F7FAFC] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={!!deletingId}
              className="h-10 rounded-[8px] bg-[#FBFF26] px-4 text-sm font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/90 disabled:opacity-60"
            >
              {deletingId ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
