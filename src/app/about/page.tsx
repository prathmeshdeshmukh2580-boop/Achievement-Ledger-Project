"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, Users, BookOpen, Target, FileText } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cream-100 border border-cream-border text-navy-800 text-xs font-semibold uppercase tracking-wider">
          <span>Design Thinking Project &bull; [Group ID / Number]</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy-900 tracking-tight">
          About Achievement Hub
        </h1>
        <p className="text-base text-gray-700 max-w-2xl mx-auto">
          A centralized, student-centric platform designed to manage and organize academic, coding, and extracurricular achievements.
        </p>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="p-6 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
        <div className="flex items-center space-x-2.5 text-amber-900 font-semibold text-base">
          <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0" />
          <span>Important Notice: AI Extraction vs. Institutional Verification</span>
        </div>
        <p className="text-sm text-amber-900/90 leading-relaxed">
          <strong>Extraction is not verification.</strong> Achievement Hub uses artificial intelligence (multimodal vision) to assist students by automatically reading and pre-filling details from certificate documents. 
          The student must always review, check, and edit the extracted fields (such as recipient name, date, issuer, and rank) before saving them to their ledger. Institutional evaluators, recruiters, and placement officers should always consult the original attached certificate file or public verification URL.
        </p>
      </div>

      {/* Design Thinking Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-xl border border-cream-border space-y-3">
          <div className="w-10 h-10 rounded-lg bg-cream-100 flex items-center justify-center text-navy-800">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-xl font-bold text-navy-900">
            Problem Identification
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            During student user research, engineering students reported storing certificate records across disparate email folders, local drives, and individual platform profiles. When applications open, compiling and verifying proof creates friction and risks omitted credentials.
          </p>
          <p className="text-xs text-gray-500 italic">
            [Add your primary user interview findings and observation data here]
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-cream-border space-y-3">
          <div className="w-10 h-10 rounded-lg bg-cream-100 flex items-center justify-center text-navy-800">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-xl font-bold text-navy-900">
            Value Proposition
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Achievement Hub centralizes achievement storage, pre-fills records from uploads with required student verification, organizes credentials into searchable categories, and compiles live platform metrics into an ATS-friendly resume.
          </p>
          <p className="text-xs text-gray-500 italic">
            [Add your Value Proposition Canvas / SCAMPER summary here]
          </p>
        </div>
      </div>

      {/* Project Team Placeholders */}
      <div className="p-6 sm:p-8 bg-white rounded-xl border border-cream-border space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-cream-100 flex items-center justify-center text-navy-800">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-navy-900">
              Project Team &bull; [Group Number / Name]
            </h2>
            <p className="text-xs text-gray-500">
              [Department Name] &bull; [Institution / University Name]
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-cream-50/70 border border-cream-border rounded-lg">
            <p className="font-semibold text-navy-900 text-sm">[Team Member 1 Name]</p>
            <p className="text-xs text-gray-500">[Student ID / Roll No]</p>
            <p className="text-[11px] text-navy-700/80 mt-1 font-medium">[Branch / Year]</p>
          </div>

          <div className="p-4 bg-cream-50/70 border border-cream-border rounded-lg">
            <p className="font-semibold text-navy-900 text-sm">[Team Member 2 Name]</p>
            <p className="text-xs text-gray-500">[Student ID / Roll No]</p>
            <p className="text-[11px] text-navy-700/80 mt-1 font-medium">[Branch / Year]</p>
          </div>

          <div className="p-4 bg-cream-50/70 border border-cream-border rounded-lg">
            <p className="font-semibold text-navy-900 text-sm">[Team Member 3 Name]</p>
            <p className="text-xs text-gray-500">[Student ID / Roll No]</p>
            <p className="text-[11px] text-navy-700/80 mt-1 font-medium">[Branch / Year]</p>
          </div>

          <div className="p-4 bg-cream-50/70 border border-cream-border rounded-lg">
            <p className="font-semibold text-navy-900 text-sm">[Team Member 4 Name]</p>
            <p className="text-xs text-gray-500">[Student ID / Roll No]</p>
            <p className="text-[11px] text-navy-700/80 mt-1 font-medium">[Branch / Year]</p>
          </div>
        </div>

        <div className="pt-2 border-t border-cream-border text-xs text-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span><strong>Faculty Guide:</strong> [Faculty Guide Name]</span>
          <span><strong>Course:</strong> Design Thinking &bull; [Academic Year / Term]</span>
        </div>
      </div>
    </div>
  );
}
