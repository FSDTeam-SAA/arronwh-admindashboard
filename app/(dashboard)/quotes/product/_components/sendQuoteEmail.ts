export type EmailQuoteResponse = {
  success?: boolean;
  status?: boolean;
  message?: string;
};

type SendQuoteEmailInput = {
  quoteId: string;
  pageUrl: string;
  price: number;
  useInvoiceEmailEndpoint?: boolean;
};

function resolveQuoteEndpoint(useInvoiceEmailEndpoint: boolean): string {
  const apiBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    ""
  ).replace(/\/+$/, "");

  if (useInvoiceEmailEndpoint) {
    return apiBase ? `${apiBase}/subscriber/quote` : "/subscriber/quote";
  }

  return apiBase ? `${apiBase}/quote` : "/quote";
}

function normalizePrice(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(2));
}

export function getBrowserPageUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.href;
}

export async function sendQuoteEmail({
  quoteId,
  pageUrl,
  price,
  useInvoiceEmailEndpoint = false,
}: SendQuoteEmailInput): Promise<EmailQuoteResponse> {
  const endpoint = resolveQuoteEndpoint(useInvoiceEmailEndpoint);
  const emailPath = useInvoiceEmailEndpoint ? "invoice/email" : "email";
  const fallbackErrorMessage = useInvoiceEmailEndpoint
    ? "Failed to send quote invoice email."
    : "Failed to send quote email.";

  const response = await fetch(
    `${endpoint}/${encodeURIComponent(quoteId)}/${emailPath}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: pageUrl,
        price: normalizePrice(price),
      }),
    }
  );

  const result = (await response.json().catch(() => null)) as
    | EmailQuoteResponse
    | null;
  const hasExplicitFailure = result?.success === false || result?.status === false;

  if (!response.ok || hasExplicitFailure) {
    throw new Error(result?.message || fallbackErrorMessage);
  }

  return result ?? {};
}
