'use client';
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { countries } from '../_components/contries';
import CountrySelector from '../_components/CountrySelector';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

const PersonalInfoForm = () => {
  const router = useRouter();

  // Form States
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find((c) => c.code === "GB") || countries[0]
  );

  const [isTitleOpen, setIsTitleOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<string>('');

  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    email: '',
    postcode: '',
    mobileNumber: '',
  });

  const titles = ["Mr", "Mrs", "Ms", "Dr"];

  // Mutation for POST request
  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        personalInfo: {
          title: selectedTitle,
          fastName: data.firstName,
          sureName: data.surname,
          email: data.email,
          mobleNumber: selectedCountry.dial_code + data.mobileNumber.replace(/\s/g, ''),
          postcode: data.postcode,
        },
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to submit form');
      }
      
      return res.json();
    },
    onSuccess: (responseData) => {
     router.push(`/quotes/product/?quoteId=${responseData.data._id}`);
    },
    onError: (error) => {
      console.error(error);
      alert('Submission failed: ' + (error.message || 'Please try again'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTitle) {
      alert("Please select a title");
      return;
    }
    if (!formData.firstName || !formData.surname || !formData.email || !formData.postcode) {
      alert("Please fill all required fields");
      return;
    }

    mutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 md:mt-8 w-full space-y-4 md:space-y-5">
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Title */}
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

        {/* First Name */}
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

        {/* Surname */}
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

      {/* Email */}
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

      {/* Postcode */}
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
      </div>

      {/* Mobile Number */}
      <div className="space-y-1">
        <label className="block text-base md:text-[17px] font-medium text-[#2D3D4D]">
          Mobile Number (optional)
        </label>
        <div className="flex h-14 items-center gap-3 bg-[#E9EEF3] px-2 w-full overflow-hidden">
          <div className="shrink-0">
            <CountrySelector
              selectedCountry={selectedCountry}
              onSelect={setSelectedCountry}
            />
          </div>
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

      {/* Marketing Consent */}
      <div className="pt-2 md:pt-1">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-[2px] shrink-0 md:mt-1">
            <input
              type="checkbox"
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

      {/* Privacy Policy */}
      <p className="text-[13px] md:text-[14px] font-normal leading-normal text-[#2D3D4D]">
        For more information on how we use your details please see our{" "}
        <a
          href="/privacy-policy"
          className="text-primary hover:underline underline-offset-4"
        >
          privacy policy.
        </a>
      </p>

      {/* Submit Button */}
      <div className="flex justify-end pt-2 md:pt-0">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="h-12 w-full md:w-auto md:min-w-[160px] rounded-[8px] bg-[#F3CF43] px-8 text-base font-bold text-[#2D3D4D] transition-all hover:bg-[#F3CF43] active:scale-95 disabled:opacity-70"
        >
          {mutation.isPending ? 'Submitting...' : 'Continue'}
        </button>
      </div>
    </form>
  );
};

export default PersonalInfoForm;