"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, AlertCircle, Award } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn(email, password);
      if (res.error) {
        setError(res.error);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-xl border border-cream-border shadow-sm">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center text-navy-800 mb-3">
          <Award className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-navy-900 tracking-tight">
          Welcome Back
        </h1>
        <p className="mt-1.5 text-sm text-gray-600">
          Sign in to access your achievement ledger and portfolio
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2.5 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
            Email Address
          </label>
          <input
            id="login-email-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@college.edu"
            className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 text-sm transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
            Password
          </label>
          <input
            id="login-password-input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 text-sm transition"
          />
        </div>

        <button
          id="login-submit-button"
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-navy-800 hover:bg-navy-700 text-cream-50 font-medium rounded-md shadow-sm transition disabled:opacity-60"
        >
          <span>{loading ? "Signing in..." : "Sign In"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-gray-500">
        Don&apos;t have an account yet?{" "}
        <Link href="/signup" className="font-semibold text-navy-800 hover:underline">
          Sign Up
        </Link>
      </div>
    </div>
  );
}
