"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-[-120px] top-[-120px] h-72 w-72 animate-pulse rounded-full bg-red-500/20 blur-3xl" />
            <div className="absolute bottom-[-120px] right-[-120px] h-80 w-80 animate-pulse rounded-full bg-pink-500/20 blur-3xl" />
            <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 animate-bounce rounded-full bg-orange-400/10 blur-3xl" />
          </div>

          <div className="relative z-10 w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-400/30">
                <div className="text-5xl animate-pulse">⚠️</div>
              </div>
            </div>

            <div className="text-center">
              <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Something went wrong
              </h1>

              <p className="mx-auto mb-2 max-w-md text-sm text-slate-300 sm:text-base">
                An unexpected error happened in the application. Please try
                again.
              </p>

              {error?.message && (
                <div className="mx-auto mt-4 max-w-md rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error.message}
                </div>
              )}

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  onClick={() => reset()}
                  className="rounded-2xl bg-white px-6 py-3 font-medium text-slate-900 transition hover:scale-105 hover:bg-slate-200 active:scale-95"
                >
                  Try again
                </button>

                <button
                  onClick={() => (window.location.href = "/")}
                  className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition hover:scale-105 hover:bg-white/10 active:scale-95"
                >
                  Go home
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}