"use client";

import React from "react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 text-white">
      
      {/* Background Animation */}
      <div className="absolute inset-0">
        <div className="absolute left-[-100px] top-[-100px] h-72 w-72 animate-pulse rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-80 w-80 animate-pulse rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 animate-bounce rounded-full bg-pink-400/10 blur-3xl" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl">
        
        {/* Animated 404 */}
        <h1 className="text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 animate-pulse">
          404
        </h1>

        <h2 className="mt-4 text-2xl font-semibold">
          Page Not Found
        </h2>

        <p className="mt-3 text-sm text-slate-300">
          The page you are looking for doesn’t exist or has been moved.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => window.history.back()}
            className="rounded-2xl bg-white px-6 py-3 font-medium text-slate-900 transition hover:scale-105 hover:bg-slate-200 active:scale-95"
          >
            Go Back
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition hover:scale-105 hover:bg-white/10 active:scale-95"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}