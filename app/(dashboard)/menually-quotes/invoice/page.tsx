'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useManualQuoteStore } from '../_store/useManualQuoteStore';

type BoilerItem = {
  name: string;
  numberOfBoiler: string;
  price: string;
};

type ControllerItem = {
  name: string;
  numberOfControllers: string;
  price: string;
};

type ExtraItem = {
  name: string;
  numberOfExtra: string;
  price: string;
};

type InvoicePayload = {
  quoteId?: string;
  customerInfo: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    postcode?: string;
  };
  boilers?: Array<{
    name: string;
    numberOfBoiler: number;
    price: number;
  }>;
  controllers?: Array<{
    name: string;
    numberOfControllers: number;
    price: number;
  }>;
  extras?: Array<{
    name: string;
    numberOfExtra: number;
    price: number;
  }>;
  vatRate?: number;
  status?: string;
  dueDate?: string;
  deliveryDate?: string;
  notes?: string;
};

const createBoilerItem = (): BoilerItem => ({
  name: '',
  numberOfBoiler: '',
  price: '',
});

const createControllerItem = (): ControllerItem => ({
  name: '',
  numberOfControllers: '',
  price: '',
});

const createExtraItem = (): ExtraItem => ({
  name: '',
  numberOfExtra: '',
  price: '',
});

const resolveInvoiceEndpoint = () => {
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');
  if (!apiBase) return '/api/v1/invoice';
  return apiBase.endsWith('/api/v1') ? `${apiBase}/invoice` : `${apiBase}/api/v1/invoice`;
};

const numberOrZero = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
};

const InvoicePage = () => {
  const formData = useManualQuoteStore((state) => state.formData);

  const [boilers, setBoilers] = useState<BoilerItem[]>([createBoilerItem()]);
  const [controllers, setControllers] = useState<ControllerItem[]>([createControllerItem()]);
  const [extras, setExtras] = useState<ExtraItem[]>([createExtraItem()]);
  const [vatRate] = useState(20);
  const [status] = useState('pending');
  const [dueDate] = useState('');
  const [deliveryDate] = useState('');
  const [notes, setNotes] = useState('Thank you for choosing Yolo Heat!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const customerInfo = useMemo(() => {
    if (!formData) {
      return {
        quoteId: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        postcode: '',
      };
    }

    const fullName = `${formData.title} ${formData.firstName} ${formData.surname}`
      .replace(/\s+/g, ' ')
      .trim();

    return {
      quoteId: formData.quoteId,
      name: fullName,
      email: formData.email,
      phone: formData.mobileNumber,
      address: formData.address,
      postcode: formData.postcode,
    };
  }, [formData]);

  const subtotal = useMemo(() => {
    const boilerTotal = boilers.reduce((sum, item) => {
      const price = numberOrZero(Number(item.price));
      const quantity = numberOrZero(Number(item.numberOfBoiler));
      return sum + price * quantity;
    }, 0);

    const controllerTotal = controllers.reduce((sum, item) => {
      const price = numberOrZero(Number(item.price));
      const quantity = numberOrZero(Number(item.numberOfControllers));
      return sum + price * quantity;
    }, 0);

    const extraTotal = extras.reduce((sum, item) => {
      const price = numberOrZero(Number(item.price));
      const quantity = numberOrZero(Number(item.numberOfExtra));
      return sum + price * quantity;
    }, 0);

    return boilerTotal + controllerTotal + extraTotal;
  }, [boilers, controllers, extras]);
  

  const vatAmount = useMemo(() => subtotal * (Math.max(0, vatRate) / 100), [subtotal, vatRate]);
  const grandTotal = useMemo(() => subtotal + vatAmount, [subtotal, vatAmount]);

  if (!formData) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-[#D9E0E7] bg-white p-6">
        <h1 className="text-2xl font-semibold text-[#2D3D4D]">Create Invoice</h1>
        <p className="mt-3 text-sm text-[#5E6B78]">
          No manual quote data found. Please fill the manual quote form first.
        </p>
        <Link
          href="/menually-quotes"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-[#F3CF43] px-6 text-sm font-bold text-[#2D3D4D]"
        >
          Back To Manual Quote
        </Link>
      </div>
    );
  }

  const handleBoilerChange = (index: number, key: keyof BoilerItem, value: string) => {
    setBoilers((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const handleControllerChange = (index: number, key: keyof ControllerItem, value: string) => {
    setControllers((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const handleExtraChange = (index: number, key: keyof ExtraItem, value: string) => {
    setExtras((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const normalizedBoilers = boilers
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        numberOfBoiler: numberOrZero(Number(item.numberOfBoiler)),
        price: numberOrZero(Number(item.price)),
      }));

    const normalizedControllers = controllers
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        numberOfControllers: numberOrZero(Number(item.numberOfControllers)),
        price: numberOrZero(Number(item.price)),
      }));

    const normalizedExtras = extras
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        numberOfExtra: numberOrZero(Number(item.numberOfExtra)),
        price: numberOrZero(Number(item.price)),
      }));

    const payload: InvoicePayload = {
      ...(customerInfo.quoteId ? { quoteId: customerInfo.quoteId } : {}),
      customerInfo: {
        ...(customerInfo.name ? { name: customerInfo.name } : {}),
        ...(customerInfo.email ? { email: customerInfo.email } : {}),
        ...(customerInfo.phone ? { phone: customerInfo.phone } : {}),
        ...(customerInfo.address ? { address: customerInfo.address } : {}),
        ...(customerInfo.postcode ? { postcode: customerInfo.postcode } : {}),
      },
      ...(normalizedBoilers.length > 0 ? { boilers: normalizedBoilers } : {}),
      ...(normalizedControllers.length > 0 ? { controllers: normalizedControllers } : {}),
      ...(normalizedExtras.length > 0 ? { extras: normalizedExtras } : {}),
      ...(Number.isFinite(vatRate) ? { vatRate: Math.max(0, Number(vatRate) || 0) } : {}),
      ...(status.trim() ? { status: status.trim() } : {}),
      ...(dueDate ? { dueDate } : {}),
      ...(deliveryDate ? { deliveryDate } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    setIsSubmitting(true);

    try {
      const res = await fetch(resolveInvoiceEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(result?.message || 'Failed to create invoice.');
      }

      toast.success(result?.message || 'Invoice created successfully.');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create invoice.');
    } finally {
      setIsSubmitting(false);
      
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="rounded-xl border border-[#D9E0E7] bg-white p-5 md:p-6">
        <h1 className="text-2xl font-semibold text-[#2D3D4D]">Create Invoice</h1>
        <p className="mt-2 text-sm text-[#5E6B78]">
          Customer details and quote id are auto-filled from manual quote data.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-md bg-[#F7FAFC] p-3">
            <p className="text-xl mb-2 text-[#5E6B78]">Customer Name</p>
            <p className="text-sm font-semibold text-[#2D3D4D]">{customerInfo.name}</p>
          </div>

          <div className="rounded-md bg-[#F7FAFC] p-3">
            <p className="text-xl mb-2 text-[#5E6B78]">Email</p>
            <p className="text-sm font-semibold text-[#2D3D4D]">{customerInfo.email}</p>
          </div>

          <div className="rounded-md bg-[#F7FAFC] p-3">
            <p className="text-xl mb-2 text-[#5E6B78]">Phone</p>
            <p className="text-sm font-semibold text-[#2D3D4D]">{customerInfo.phone || 'N/A'}</p>
          </div>

          <div className="rounded-md bg-[#F7FAFC] p-3 md:col-span-2">
            <p className="text-xl mb-2 text-[#5E6B78]">Address</p>
            <p className="text-sm font-semibold text-[#2D3D4D]">
              {customerInfo.address}, {customerInfo.postcode}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border border-[#D9E0E7] bg-white p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#2D3D4D]">Boilers</h2>
            <button
              type="button"
              onClick={() => setBoilers((prev) => [...prev, createBoilerItem()])}
              className="inline-flex items-center gap-2 rounded-md border border-[#D5DCE3] px-3 py-1.5 text-sm font-medium text-[#2D3D4D] hover:bg-[#F7FAFC]"
            >
              <Plus className="h-4 w-4" />
              Add Boiler
            </button>
          </div>

          <div className="space-y-3">
            {boilers.map((item, index) => (
              <div
                key={`boiler-${index}`}
                className="grid gap-3 rounded-md border border-[#E5EAF0] p-3 md:grid-cols-12"
              >
                <div className="md:col-span-6">
                  <label className="mb-1 block text-sm font-medium text-[#2D3D4D]">
                    Name
                  </label>
                  <input
                    value={item.name}
                    onChange={(e) => handleBoilerChange(index, 'name', e.target.value)}
                    placeholder="Boiler name"
                    className="h-11 w-full rounded-md border border-[#D5DCE3] px-3 text-sm text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#2D3D4D]">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={item.numberOfBoiler}
                    onChange={(e) =>
                      handleBoilerChange(index, 'numberOfBoiler', e.target.value)
                    }
                    placeholder="Qty"
                    className="h-11 w-full rounded-md border border-[#D5DCE3] px-3 text-sm text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="mb-1 block text-sm font-medium text-[#2D3D4D]">
                    Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.price}
                    onChange={(e) => handleBoilerChange(index, 'price', e.target.value)}
                    placeholder="Price"
                    className="h-11 w-full rounded-md border border-[#D5DCE3] px-3 text-sm text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-1 md:flex md:items-end md:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setBoilers((prev) =>
                        prev.length > 1
                          ? prev.filter((_, itemIndex) => itemIndex !== index)
                          : prev,
                      )
                    }
                    className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#E6BAC0] text-[#C0392B] hover:bg-[#FFF4F5]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#D9E0E7] bg-white p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#2D3D4D]">Controllers</h2>
            <button
              type="button"
              onClick={() => setControllers((prev) => [...prev, createControllerItem()])}
              className="inline-flex items-center gap-2 rounded-md border border-[#D5DCE3] px-3 py-1.5 text-sm font-medium text-[#2D3D4D] hover:bg-[#F7FAFC]"
            >
              <Plus className="h-4 w-4" />
              Add Controller
            </button>
          </div>

          <div className="space-y-3">
            {controllers.map((item, index) => (
              <div
                key={`controller-${index}`}
                className="grid gap-3 rounded-md border border-[#E5EAF0] p-3 md:grid-cols-12"
              >
                <div className="md:col-span-6">
                  <label className="mb-1 block text-sm font-medium text-[#2D3D4D]">
                    Name
                  </label>
                  <input
                    value={item.name}
                    onChange={(e) => handleControllerChange(index, 'name', e.target.value)}
                    placeholder="Controller name"
                    className="h-11 w-full rounded-md border border-[#D5DCE3] px-3 text-sm text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#2D3D4D]">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={item.numberOfControllers}
                    onChange={(e) =>
                      handleControllerChange(index, 'numberOfControllers', e.target.value)
                    }
                    placeholder="Qty"
                    className="h-11 w-full rounded-md border border-[#D5DCE3] px-3 text-sm text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="mb-1 block text-sm font-medium text-[#2D3D4D]">
                    Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.price}
                    onChange={(e) => handleControllerChange(index, 'price', e.target.value)}
                    placeholder="Price"
                    className="h-11 w-full rounded-md border border-[#D5DCE3] px-3 text-sm text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-1 md:flex md:items-end md:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setControllers((prev) =>
                        prev.length > 1
                          ? prev.filter((_, itemIndex) => itemIndex !== index)
                          : prev,
                      )
                    }
                    className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#E6BAC0] text-[#C0392B] hover:bg-[#FFF4F5]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#D9E0E7] bg-white p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#2D3D4D]">Extras</h2>
            <button
              type="button"
              onClick={() => setExtras((prev) => [...prev, createExtraItem()])}
              className="inline-flex items-center gap-2 rounded-md border border-[#D5DCE3] px-3 py-1.5 text-sm font-medium text-[#2D3D4D] hover:bg-[#F7FAFC]"
            >
              <Plus className="h-4 w-4" />
              Add Extra
            </button>
          </div>

          <div className="space-y-3">
            {extras.map((item, index) => (
              <div
                key={`extra-${index}`}
                className="grid gap-3 rounded-md border border-[#E5EAF0] p-3 md:grid-cols-12"
              >
                <div className="md:col-span-6">
                  <label className="mb-1 block text-sm font-medium text-[#2D3D4D]">
                    Name
                  </label>
                  <input
                    value={item.name}
                    onChange={(e) => handleExtraChange(index, 'name', e.target.value)}
                    placeholder="Extra name"
                    className="h-11 w-full rounded-md border border-[#D5DCE3] px-3 text-sm text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#2D3D4D]">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={item.numberOfExtra}
                    onChange={(e) =>
                      handleExtraChange(index, 'numberOfExtra', e.target.value)
                    }
                    placeholder="Qty"
                    className="h-11 w-full rounded-md border border-[#D5DCE3] px-3 text-sm text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="mb-1 block text-sm font-medium text-[#2D3D4D]">
                    Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.price}
                    onChange={(e) => handleExtraChange(index, 'price', e.target.value)}
                    placeholder="Price"
                    className="h-11 w-full rounded-md border border-[#D5DCE3] px-3 text-sm text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-1 md:flex md:items-end md:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setExtras((prev) =>
                        prev.length > 1
                          ? prev.filter((_, itemIndex) => itemIndex !== index)
                          : prev,
                      )
                    }
                    className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#E6BAC0] text-[#C0392B] hover:bg-[#FFF4F5]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#D9E0E7] bg-white p-5 md:p-6">
          <h2 className="text-lg font-semibold text-[#2D3D4D]">Notes</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-[#D5DCE3] p-3 text-sm text-[#2D3D4D] focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Write invoice note..."
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#D9E0E7] bg-white p-5 md:p-6">
          <h2 className="text-lg font-semibold text-[#2D3D4D]">Amount Summary</h2>
          <div className="mt-4 space-y-2 text-sm text-[#2D3D4D]">
            <div className="mt-2 flex justify-between border-t border-[#E5EAF0] pt-2 text-base font-semibold">
              <span>Total</span>
              <span>£{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {submitError && (
          <div className="rounded-md border border-[#E6BAC0] bg-[#FFF4F5] px-4 py-3 text-sm text-[#C0392B]">
            {submitError}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 min-w-[170px] rounded-[8px] bg-[#FBFF26] px-8 text-base font-medium text-[#2D3D4D] transition-all hover:bg-[#FBFF26]/90 disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting...' : 'Send Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoicePage;