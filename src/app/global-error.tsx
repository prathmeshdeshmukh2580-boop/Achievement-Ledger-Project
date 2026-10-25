"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAF8F5] text-[#0A172B] p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-md w-full bg-white p-6 rounded-xl border border-gray-200 text-center space-y-4 shadow-sm">
          <h2 className="text-2xl font-bold text-[#0A172B]">Something went wrong</h2>
          <p className="text-sm text-gray-600">
            {error?.message || "An unexpected application error occurred."}
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-[#0F2444] text-[#FAF8F2] rounded-md text-sm hover:bg-[#132D54] transition"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
