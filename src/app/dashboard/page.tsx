"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AchievementCategory, AchievementType, Achievement } from "@/types";
import {
  Award,
  Search,
  Filter,
  ExternalLink,
  Trash2,
  Calendar,
  Building,
  PlusCircle,
  Sparkles,
  CheckCircle,
  FileText,
  User,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, achievements, deleteAchievement, loading } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="py-24 text-center text-navy-800 text-sm">
        Loading your achievements...
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
          Student Sign In Required
        </h2>
        <p className="text-sm text-gray-600">
          Please sign in or create an account to access your personal achievement ledger.
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
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  // Calculate category counts for current user
  const categoryCounts: Record<string, number> = {};
  achievements.forEach((a) => {
    categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
  });

  // Categories where count >= 1 (ZERO CARDS SUPPRESSED)
  const activeCategories = Object.keys(categoryCounts).sort();

  // Filter achievements
  const filtered = achievements.filter((a) => {
    const matchesSearch =
      a.achievement_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.summary && a.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.recipient_name && a.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All" || a.category === selectedCategory;

    const matchesType =
      selectedType === "All" || a.achievement_type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this achievement record?")) return;
    setDeletingId(id);
    await deleteAchievement(id);
    setDeletingId(null);
  };

  return (
    <div className="py-2 space-y-8">
      {/* Student Profile Header */}
      <div className="p-6 sm:p-8 bg-white rounded-xl border border-cream-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1">
            <span>Student Achievement Ledger</span>
            <span>&bull;</span>
            <span className="text-gray-500">{user.yearOfStudy}</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-navy-900">
            {user.fullName}
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            {user.branch} &bull; {user.college} ({user.city}, {user.state})
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Link
            href="/extract"
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-navy-800 hover:bg-navy-700 text-cream-50 text-xs font-semibold rounded-md shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Certificate</span>
          </Link>
          <Link
            href="/resume"
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-cream-100 hover:bg-cream-200 text-navy-900 border border-cream-border text-xs font-semibold rounded-md transition"
          >
            <FileText className="w-4 h-4" />
            <span>View Resume</span>
          </Link>
        </div>
      </div>

      {/* Active Category Metric Cards (Only shown if user has at least 1 achievement in that category) */}
      {activeCategories.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-lg font-bold text-navy-900">
              Categories with Achievements
            </h2>
            <span className="text-xs text-gray-500">
              {achievements.length} Total Verified Records
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {activeCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? "All" : cat)}
                className={`p-3.5 rounded-lg border text-left transition ${
                  selectedCategory === cat
                    ? "bg-navy-800 text-cream-50 border-navy-800 shadow-sm"
                    : "bg-white border-cream-border text-navy-900 hover:bg-cream-50"
                }`}
              >
                <p className="text-[11px] font-medium opacity-80 uppercase tracking-wider truncate">
                  {cat}
                </p>
                <p className="font-serif text-2xl font-bold mt-1">
                  {categoryCounts[cat]}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 bg-white rounded-xl border border-cream-border shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="search-achievements-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, event, issuer, or keyword..."
            className="w-full pl-9 pr-4 py-2 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-xs focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          {/* Category Dropdown Filter */}
          <select
            id="filter-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-xs focus:outline-none focus:ring-1 focus:ring-navy-500"
          >
            <option value="All">All Categories ({achievements.length})</option>
            {activeCategories.map((c) => (
              <option key={c} value={c}>
                {c} ({categoryCounts[c]})
              </option>
            ))}
          </select>

          {/* Type Dropdown Filter */}
          <select
            id="filter-type-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-xs focus:outline-none focus:ring-1 focus:ring-navy-500"
          >
            <option value="All">All Types</option>
            <option value="winner">Winner / Rank</option>
            <option value="runner_up">Runner Up</option>
            <option value="finalist">Finalist</option>
            <option value="participation">Participation</option>
            <option value="completion">Course Completion</option>
          </select>
        </div>
      </div>

      {/* Achievements List */}
      {filtered.length === 0 ? (
        <div className="p-12 bg-white rounded-xl border border-cream-border text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-full bg-cream-100 flex items-center justify-center text-navy-800">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-navy-900">
              {achievements.length === 0
                ? "Your Achievement Ledger is Empty"
                : "No Matching Achievements Found"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {achievements.length === 0
                ? "Start by uploading your course certifications, hackathon certificates, or contest awards. Gemini vision will extract the details for your review."
                : "Try clearing your search query or switching your category filter."}
            </p>
          </div>
          {achievements.length === 0 ? (
            <Link
              href="/extract"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-navy-800 text-cream-50 text-xs font-semibold rounded hover:bg-navy-700 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Upload First Certificate</span>
            </Link>
          ) : (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
                setSelectedType("All");
              }}
              className="text-xs text-navy-800 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white rounded-xl border border-cream-border shadow-sm flex flex-col justify-between hover:border-navy-500/40 transition space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-cream-100 text-navy-900 rounded border border-cream-border">
                        {item.category}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-medium capitalize bg-navy-50 text-navy-800 rounded">
                        {item.achievement_type.replace("_", " ")}
                      </span>
                      {item.position && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded">
                          {item.position}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg font-bold text-navy-900 leading-snug">
                      {item.achievement_title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    title="Delete record"
                    className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded transition flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* One-Line Summary Box */}
                <div className="mt-2 p-2.5 bg-cream-50 rounded border border-cream-border/70 text-xs text-navy-900 font-medium">
                  &ldquo;{item.summary}&rdquo;
                </div>

                {/* Metadata Details */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-1.5 truncate">
                    <Building className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{item.issuer || item.event_name}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{item.date}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Verification & Original Proof Link */}
              <div className="pt-3 border-t border-cream-border/60 flex items-center justify-between text-xs">
                {item.file_url ? (
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-navy-800 hover:text-navy-900 hover:underline font-medium text-[11px]"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Certificate Proof</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-gray-400">Manual Record</span>
                )}

                {item.verification_url ? (
                  <a
                    href={item.verification_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-navy-800 hover:text-navy-900 hover:underline font-medium text-[11px]"
                  >
                    <span>Verify Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : item.credential_id ? (
                  <span className="text-[11px] text-gray-500">
                    ID: {item.credential_id}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
