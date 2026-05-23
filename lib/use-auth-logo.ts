"use client";

import { useEffect, useState } from "react";

type LogoResponse = {
  data?:
    | Array<{
        image?: string;
      }>
    | {
        image?: string;
      }
    | null;
};

const FALLBACK_LOGO_SRC = "/logo.png";

const getLogoEndpoint = () => {
  const base = (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_BACKEND_API_URL ??
    ""
  ).replace(/\/+$/, "");

  if (!base) return "/api/v1/logo";
  return base.endsWith("/api/v1") ? `${base}/logo` : `${base}/api/v1/logo`;
};

export const useAuthLogo = () => {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [isLogoLoading, setIsLogoLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchLogo = async () => {
      try {
        const response = await fetch(getLogoEndpoint());
        if (!response.ok) {
          if (isMounted) setLogoSrc(FALLBACK_LOGO_SRC);
          return;
        }

        const payload = (await response.json()) as LogoResponse;
        const logoItem = Array.isArray(payload?.data)
          ? payload.data[0]
          : payload?.data;
        const imageUrl =
          typeof logoItem?.image === "string" ? logoItem.image.trim() : "";

        if (isMounted) {
          setLogoSrc(imageUrl || FALLBACK_LOGO_SRC);
        }
      } catch (error) {
        console.error("Failed to load logo:", error);
        if (isMounted) setLogoSrc(FALLBACK_LOGO_SRC);
      } finally {
        if (isMounted) setIsLogoLoading(false);
      }
    };

    void fetchLogo();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogoError = () => {
    setLogoSrc(FALLBACK_LOGO_SRC);
    setIsLogoLoading(false);
  };

  return {
    logoSrc: logoSrc ?? FALLBACK_LOGO_SRC,
    isLogoLoading,
    handleLogoError,
  };
};
