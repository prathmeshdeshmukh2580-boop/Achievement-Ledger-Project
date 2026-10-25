"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Printer,
  FileDown,
  ExternalLink,
  Award,
  Github,
  Code,
  Trophy,
  Terminal,
  User,
  ArrowLeft,
} from "lucide-react";

export default function ResumePage() {
  const { user, achievements, platformStats, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-24 text-center text-navy-800 text-sm">
        Compiling resume...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-xl border border-cream-border text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 mx-auto rounded-full bg-cream-100 flex items-center justify-center text-navy-800">
          <User className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-navy-900">
          Student Authentication Required
        </h2>
        <p className="text-sm text-gray-600">
          Sign in or create an account to view and print your personalized achievement resume.
        </p>
        <div className="pt-2 flex justify-center space-x-3">
          <Link
            href="/login"
            className="px-4 py-2 bg-navy-800 text-cream-50 text-xs font-semibold rounded hover:bg-navy-700 transition"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-cream-100 text-navy-900 border border-cream-border text-xs font-semibold rounded hover:bg-cream-200 transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  // Group achievements by category
  const categoriesPresent = Array.from(new Set(achievements.map((a) => a.category))).sort();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="py-2 space-y-6 max-w-4xl mx-auto">
      {/* Top action bar (hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-cream-border shadow-sm">
        <div className="flex items-center space-x-2">
          <Link
            href="/dashboard"
            className="flex items-center space-x-1 text-xs text-navy-700 hover:text-navy-900 bg-cream-50 px-3 py-1.5 rounded border border-cream-border transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <span className="text-xs text-gray-500">
            &bull; Ready for placements, internships, and evaluators
          </span>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-5 py-2 bg-navy-800 hover:bg-navy-700 text-cream-50 text-xs font-semibold rounded-md shadow-sm transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Printable Sheet (ATS-Friendly / Academic Portfolio Layout) */}
      <div className="print-page bg-white p-8 sm:p-12 rounded-xl border border-cream-border shadow-sm space-y-8 text-navy-900">
        {/* Header: Student Info */}
        <div className="border-b-2 border-navy-900 pb-5 space-y-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-navy-900">
                {user.fullName}
              </h1>
              <p className="text-sm font-medium text-navy-800 mt-1">
                {user.branch} &bull; {user.yearOfStudy}
              </p>
            </div>
            <div className="text-xs text-right text-gray-600 sm:self-end">
              <p className="font-semibold text-navy-900">{user.college}</p>
              <p>{user.city}, {user.state}</p>
              <p>{user.email}</p>
            </div>
          </div>
        </div>

        {/* Platform Links & Live Stats Summary */}
        {(platformStats.github ||
          platformStats.leetcode ||
          platformStats.codeforces ||
          platformStats.hackerrank ||
          platformStats.credly) && (
          <div className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-navy-900 border-b border-cream-border pb-1 uppercase tracking-wider text-xs">
              Competitive Programming &amp; Digital Profiles
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {platformStats.github && (
                <div className="p-2.5 bg-cream-50/60 rounded border border-cream-border">
                  <p className="font-semibold flex items-center space-x-1 text-navy-900">
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub: @{platformStats.github.username}</span>
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {platformStats.github.repos} Repos &bull; {platformStats.github.followers} Followers
                  </p>
                </div>
              )}

              {platformStats.leetcode && (
                <div className="p-2.5 bg-cream-50/60 rounded border border-cream-border">
                  <p className="font-semibold flex items-center space-x-1 text-navy-900">
                    <Code className="w-3.5 h-3.5 text-amber-600" />
                    <span>LeetCode: @{platformStats.leetcode.username}</span>
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {platformStats.leetcode.totalSolved} Solved ({platformStats.leetcode.easy}E / {platformStats.leetcode.medium}M / {platformStats.leetcode.hard}H)
                  </p>
                </div>
              )}

              {platformStats.codeforces && (
                <div className="p-2.5 bg-cream-50/60 rounded border border-cream-border">
                  <p className="font-semibold flex items-center space-x-1 text-navy-900">
                    <Trophy className="w-3.5 h-3.5 text-blue-600" />
                    <span>Codeforces: {platformStats.codeforces.username}</span>
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Rating: {platformStats.codeforces.rating} ({platformStats.codeforces.rank})
                  </p>
                </div>
              )}

              {platformStats.credly && (
                <div className="p-2.5 bg-cream-50/60 rounded border border-cream-border">
                  <p className="font-semibold flex items-center space-x-1 text-navy-900">
                    <Award className="w-3.5 h-3.5 text-teal-600" />
                    <span>Credly Badges</span>
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {platformStats.credly.badgeCount} Verified Badges
                  </p>
                </div>
              )}

              {platformStats.hackerrank && (
                <div className="p-2.5 bg-cream-50/60 rounded border border-cream-border">
                  <p className="font-semibold flex items-center space-x-1 text-navy-900">
                    <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                    <span>HackerRank: @{platformStats.hackerrank.username}</span>
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {platformStats.hackerrank.badges} Badges &bull; {platformStats.hackerrank.stars} Stars
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categorized Achievements Section (One-Line Summaries) */}
        <div className="space-y-6">
          <h2 className="font-serif text-lg font-bold text-navy-900 border-b border-cream-border pb-1 uppercase tracking-wider text-xs">
            Verified Achievements &amp; Certifications
          </h2>

          {achievements.length === 0 ? (
            <p className="text-xs text-gray-500 italic">
              No achievements recorded yet. Add your certificates in the Achievement Hub to populate this section.
            </p>
          ) : (
            <div className="space-y-6">
              {categoriesPresent.map((cat) => {
                const items = achievements.filter((a) => a.category === cat);
                return (
                  <div key={cat} className="space-y-2">
                    <h3 className="font-serif text-sm font-bold text-navy-800 tracking-wide">
                      {cat}s ({items.length})
                    </h3>
                    <ul className="space-y-2 border-l-2 border-cream-border pl-3">
                      {items.map((item) => (
                        <li key={item.id} className="text-xs space-y-0.5">
                          <div className="flex justify-between items-baseline">
                            <span className="font-semibold text-navy-900">
                              {item.summary}
                            </span>
                            <span className="text-[11px] text-gray-500 flex-shrink-0 ml-2">
                              {item.date}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                            <span>Issuer: {item.issuer}</span>
                            {item.position && (
                              <span>&bull; Position: <strong className="text-navy-900">{item.position}</strong></span>
                            )}
                            {item.credential_id && (
                              <span>&bull; ID: {item.credential_id}</span>
                            )}
                            {item.verification_url && (
                              <a
                                href={item.verification_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-navy-700 hover:underline inline-flex items-center space-x-0.5"
                              >
                                <span>[Verification Link]</span>
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="pt-6 border-t border-cream-border text-[10px] text-gray-500 text-center">
          Generated automatically by Achievement Hub &bull; Design Thinking Project (Group 7, JSPM&apos;s RSCOE) &bull; Verified Student Record
        </div>
      </div>
    </div>
  );
}
