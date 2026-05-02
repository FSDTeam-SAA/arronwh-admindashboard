export type EmailQuoteResponse = {
  success?: boolean;
  status?: boolean;
  message?: string;
};

type SendQuoteEmailInput = {
  quoteId: string;
  pageUrl: string;
  price: number;
};

function resolveQuoteEndpoint(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/quote`;
  }
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/quote`;
  }
  return "/quote";
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
}: SendQuoteEmailInput): Promise<EmailQuoteResponse> {
  const response = await fetch(
    `${resolveQuoteEndpoint()}/${encodeURIComponent(quoteId)}/email`,
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
    throw new Error(result?.message || "Failed to send quote email.");
  }

  return result ?? {};
}
