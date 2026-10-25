"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="font-serif text-3xl font-bold text-navy-900 mb-2">Something went wrong</h1>
      <p className="text-gray-600 mb-6 text-sm max-w-md">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-navy-800 text-cream-50 rounded-md text-sm hover:bg-navy-700 transition"
      >
        Try Again
      </button>
    </div>
  );
}
