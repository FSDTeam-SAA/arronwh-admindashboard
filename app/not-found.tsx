"use client";

import React from "react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F0F3F6] px-6 text-white">
      
   

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-white p-8 text-center shadow-2xl backdrop-blur-xl">
        
        {/* Animated 404 */}
        <h1 className="text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 animate-pulse">
          404
        </h1>

        <h2 className="mt-4 text-2xl text-red-600 font-semibold">
          Page Not Found
        </h2>

        <p className="mt-3 text-sm text-gray-500">
          The page you are looking for doesn’t exist or has been moved.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => window.history.back()}
            className="rounded-2xl bg-[#1b6bbc] px-6 py-3 font-medium text-white transition hover:scale-105  active:scale-95"
          >
            Go Back
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="rounded-2xl  bg-[#06e227] px-6 py-3 font-medium text-white transition hover:scale-105  active:scale-95"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}