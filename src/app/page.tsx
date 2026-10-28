"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Award, ArrowRight, ShieldCheck, Zap, FileSpreadsheet, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="py-6 sm:py-12 space-y-16">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cream-100 border border-cream-border text-navy-800 text-xs font-semibold uppercase tracking-wider">
          <span>Design Thinking Project &bull; Group 7</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-navy-900 leading-tight">
          Centralize, Extract &amp; Showcase Your Student Achievements
        </h1>
        <p className="text-base sm:text-lg text-gray-700 font-normal leading-relaxed">
          No more searching through chaotic Downloads folders, emails, or scattered platforms.
          Upload certificates to auto-extract verified metadata with Gemini AI, sync your live coding stats,
          and generate ATS-ready portfolios in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 bg-navy-800 hover:bg-navy-700 text-cream-50 font-medium rounded-md shadow-sm transition flex items-center justify-center space-x-2 text-sm"
              >
                <span>Go to Your Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/extract"
                className="w-full sm:w-auto px-6 py-3 bg-cream-100 hover:bg-cream-200 text-navy-900 font-medium rounded-md border border-cream-border transition flex items-center justify-center space-x-2 text-sm"
              >
                <Award className="w-4 h-4" />
                <span>Extract Certificate</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="w-full sm:w-auto px-6 py-3 bg-navy-800 hover:bg-navy-700 text-cream-50 font-medium rounded-md shadow-sm transition flex items-center justify-center space-x-2 text-sm"
              >
                <span>Create Student Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3 bg-cream-100 hover:bg-cream-200 text-navy-900 font-medium rounded-md border border-cream-border transition flex items-center justify-center space-x-2 text-sm"
              >
                <span>Sign In</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-6 bg-white rounded-xl border border-cream-border shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-cream-100 flex items-center justify-center text-navy-800">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-xl font-bold text-navy-900">
            AI Multimodal Vision
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Extract title, issuer, date, category, and achievement type directly from certificate images and PDFs with high-precision vision parsing.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-cream-border shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-cream-100 flex items-center justify-center text-navy-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-xl font-bold text-navy-900">
            Student Verification
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            AI assists pre-filling, but you maintain full review control. Check and edit fields before saving into your private, secure ledger.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-cream-border shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-cream-100 flex items-center justify-center text-navy-800">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-xl font-bold text-navy-900">
            One-Click Resume
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Automatically compile categorized achievements and live coding metrics into a clean, printable resume formatted for campus placements.
          </p>
        </div>
      </div>

      {/* Design Thinking Project Attribution */}
      <div className="p-6 bg-cream-100/70 rounded-xl border border-cream-border text-center space-y-2">
        <h3 className="font-serif text-lg font-bold text-navy-900">
          Design Thinking Project &bull; CSBS &bull; JSPM's RSCOE
        </h3>
        <p className="text-xs text-gray-600 max-w-2xl mx-auto">
          Department of Computer Science & Business Systems &bull; Under the guidance of Prof. Suhasini Bhat &bull;
          Team: Prathmesh Deshmukh (RBT25CB044), Atharva Gogawale (RBT25CB053), Aarya Nehete (RBT25CB016), Poras Badwaik (RBT25CB002)
        </p>
      </div>
    </div>
  );
}
