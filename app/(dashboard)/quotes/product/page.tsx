"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard, ProductItem } from "./_components/ProductCard";
import BoilerProductsPageSkeleton from "./_components/BoilerProductsPageSkeleton";
import { useQuoteById } from "./_components/useQuoteById";
import { getQuotePriceAdjustmentTotal } from "./_components/getQuotePriceAdjustmentItems";
import { usePropertyOverviewStore } from "./_components/usePropertyOverviewStore";

type ApiBoilerFeature = {
  title?: string;
  value?: string;
  details?: string;
};

type ApiProduct = {
  _id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  images?: string[];
  badges?: string[];
  price?: number;
  discountPrice?: number;
  payablePrice?: number;
  monthlyPrice?: number;
  boilerAbility?: string;
  boilerFeatures?: Array<ApiBoilerFeature | string>;
  boilerIncludedData?: string;
  isBestSeller?: boolean;
};

type ProductsApiResponse = {
  statusCode: number;
  success: boolean;
  status?: boolean;
  message: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
  data: ApiProduct[];
};




const FALLBACK_IMAGE = "/product.png";




const resetPropertyOverviewStore = () => {
  usePropertyOverviewStore.setState({
    currentStep: 0,
    answers: {},
    selectedProductId: null,
    personalInfo: {
      title: "",
      fastName: "",
      sureName: "",
      email: "",
      mobleNumber: "",
      postcode: "",
    },
    isSubmitting: false,
    submitError: null,
    submitSuccessMessage: null,
    quoteId: null,
  });
};

const stripHtml = (value?: string) =>
  value
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim() ?? "";

const formatMoney = (value?: number) =>
  typeof value === "number" && Number.isFinite(value) ? `£${value.toLocaleString("en-US")}` : "";

const normalizeImage = (image?: string) => {
  if (!image) return FALLBACK_IMAGE;
  if (image.startsWith("/") || image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  return FALLBACK_IMAGE;
};

const resolveProductsEndpoint = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/products`;
  }
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/products`;
  }
  return "/products";
};

const fetchProducts = async (): Promise<ApiProduct[]> => {
  const response = await fetch(resolveProductsEndpoint());
  const result = (await response.json().catch(() => null)) as ProductsApiResponse | null;
  const hasExplicitFailure = result?.success === false || result?.status === false;

  if (!response.ok || hasExplicitFailure) {
    throw new Error(result?.message || "Failed to fetch products");
  }

  return result?.data ?? [];
};

const toProductCardItem = (
  product: ApiProduct,
  quizPriceAdjustment = 0
): ProductItem => {
  const title = stripHtml(product.title) || product.title;
  const boilerAbility = stripHtml(product.boilerAbility) || title;
  const tags = (product.badges ?? []).map((tag) => tag.trim()).filter(Boolean);
  const images = (product.images ?? []).map(normalizeImage);
  const description = stripHtml(product.description);
  const summaryTitle = stripHtml(product.shortDescription) || title;
  const normalizedQuizPriceAdjustment =
    Number.isFinite(quizPriceAdjustment) && quizPriceAdjustment > 0
      ? quizPriceAdjustment
      : 0;

  const summaryPoints = [description, stripHtml(product.boilerAbility), stripHtml(product.boilerIncludedData)]
    .filter(
      (point, index, arr) =>
        point && point !== summaryTitle && arr.indexOf(point) === index
    );

  const specs = (product.boilerFeatures ?? [])
    .map((feature) => {
      if (typeof feature === "string") {
        const value = stripHtml(feature);
        return {
          label: value ? "Feature" : "",
          value,
        };
      }

      return {
        label: feature?.title?.trim() ?? "",
        value: stripHtml(feature?.value ?? feature?.details ?? ""),
      };
    })
    .filter((feature) => feature.label && feature.value);

  const payablePriceBase =
    typeof product.payablePrice === "number"
      ? product.payablePrice
      : typeof product.price === "number"
        ? product.price
        : 0;
  const adjustedPayablePrice = payablePriceBase + normalizedQuizPriceAdjustment;
  const adjustedOriginalPrice =
    typeof product.price === "number"
      ? product.price + normalizedQuizPriceAdjustment
      : undefined;
  const payToday = formatMoney(adjustedPayablePrice) || "£0";
  const payTodayOld =
    typeof adjustedOriginalPrice === "number" &&
    adjustedOriginalPrice > adjustedPayablePrice
      ? `was ${formatMoney(adjustedOriginalPrice)}`
      : "";

  const monthlyPriceNumber =
    adjustedPayablePrice > 0
      ? Number((adjustedPayablePrice / 12).toFixed(2))
      : typeof adjustedOriginalPrice === "number" && adjustedOriginalPrice > 0
        ? Number((adjustedOriginalPrice / 12).toFixed(2))
        : 0;
  const monthlyCost = monthlyPriceNumber > 0 ? `${formatMoney(monthlyPriceNumber)}/mo` : "£0/mo";

  const discountAmount =
    typeof product.discountPrice === "number" && product.discountPrice > 0
      ? product.discountPrice
      : typeof product.price === "number" && typeof product.payablePrice === "number"
        ? Math.max(product.price - product.payablePrice, 0)
        : 0;

  return {
    id: product._id,
    title,
    boilerAbility,
    topBadge: product.isBestSeller ? "OUR BEST SELLER" : undefined,
    tags,
    images: images.length ? images : [FALLBACK_IMAGE],
    summaryTitle,
    summaryPoints,
    specs,
    payToday,
    payTodayOld,
    monthlyCost,
    monthlyCostOld: "",
    discountTitle: `${title} Discount`,
    discountValue: discountAmount > 0 ? `-£${discountAmount.toLocaleString("en-US")}` : "£0",
    payablePriceValue: adjustedPayablePrice,
    priceValue: adjustedOriginalPrice ?? 0,
    discountAmountValue: discountAmount,
    monthlyPriceValue: monthlyPriceNumber > 0 ? monthlyPriceNumber : undefined,
  };
};

export default function BoilerProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get("quoteId");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const { data: quote } = useQuoteById(quoteId);

  const {
    data: productsData = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const quotePriceAdjustment = useMemo(
    () => getQuotePriceAdjustmentTotal(quote?.quizAnswers),
    [quote?.quizAnswers]
  );
  const products = useMemo(
    () => productsData.map((product) => toProductCardItem(product, quotePriceAdjustment)),
    [productsData, quotePriceAdjustment]
  );
 

  const handleResetAnswers = () => {
    resetPropertyOverviewStore();
    setIsResetModalOpen(false);
    router.push("/boilers/property-overview");
  };

  if (isLoading) {
    return <BoilerProductsPageSkeleton />;
  }

  return (
    <div>
   
      <div className="bg-[#EEF2F5] !px-0 py-4 sm:px-0 lg:px-0 ">
        <div className="mx-auto container">
          {/* Top Filter */}
          {/* <div className="mb-5 flex flex-col items-end gap-2">
            <div className="flex w-full max-w-[860px] flex-wrap overflow-hidden rounded-full border border-[#D9E0E7] bg-white shadow-sm sm:w-auto sm:flex-nowrap">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2 text-left text-[12px] sm:text-[13px] font-medium text-[#2D3D4D]"
              >
                {selectedFilter}
              </button>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="w-full border-t border-[#E5E7EB] px-4 py-2 text-[12px] sm:w-auto sm:border-l sm:border-t-0 sm:text-[13px] font-medium text-[#2D3D4D]"
              >
                Start again
              </button>
            </div>
          </div> */}

          <div className="space-y-5">
            {isError ? (
              <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 text-[15px] text-[#2D3D4D]">
                {error instanceof Error ? error.message : "Failed to load products."}
              </div>
            ) : products.length ? (
              products.map((product) => <ProductCard key={product.id} product={product} />)
            ) : (
              <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-5 text-[15px] text-[#2D3D4D]">
                No products available right now.
              </div>
            )}
          </div>
        </div>
      </div>

      {isResetModalOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#233445]/45 px-4 backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="start-again-title"
          onClick={() => setIsResetModalOpen(false)}
        >
          <div
            className="w-full max-w-[560px] rounded-[12px] bg-white p-4 shadow-[0_24px_64px_rgba(15,23,42,0.25)] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="start-again-title"
              className="text-center text-[28px] font-semibold leading-none text-[#233445] sm:text-[35px]"
            >
              Start again?
            </h2>
            <p className="mx-auto mt-4 max-w-[420px] text-center text-[18px] leading-[1.35] text-[#233445] sm:text-[24px]">
              Continuing will reset your answers and take you back to the first question.
            </p>

            <button
              type="button"
              onClick={handleResetAnswers}
              className="mt-6 inline-flex h-[58px] w-full items-center justify-center gap-3 rounded-[2px] bg-[#00A56F] px-4 text-[20px] font-medium text-white transition hover:bg-[#009562] sm:text-[24px]"
            >
              <RotateCcw className="h-6 w-6 sm:h-7 sm:w-7" />
              Reset answers
            </button>

            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="mt-3 inline-flex h-[58px] w-full items-center justify-center rounded-[2px] border border-[#00A56F] bg-white px-4 text-[20px] font-medium text-[#00A56F] transition hover:bg-[#F1FCF8] sm:text-[24px]"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
