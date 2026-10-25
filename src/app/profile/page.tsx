"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CollegeSelector from "@/components/CollegeSelector";
import { YearOfStudy } from "@/types";
import { Save, User, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateProfile, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState<YearOfStudy>("2nd Year");
  const [branch, setBranch] = useState("");
  const [customBranch, setCustomBranch] = useState("");

  const [geoData, setGeoData] = useState({
    state: "",
    district: "",
    college: "",
    customCollege: "",
  });
  const [city, setCity] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      setFullName(user.fullName || "");
      setYearOfStudy(user.yearOfStudy || "2nd Year");
      setBranch(user.branch || "CSBS");
      setCity(user.city || "");
      setGeoData({
        state: user.state || "",
        district: user.district || "",
        college: user.college || "",
        customCollege: user.customCollege || "",
      });
    }
  }, [user, authLoading, router]);

  const branches = [
    "Computer Science & Business Systems (CSBS)",
    "Computer Science & Engineering (CSE)",
    "Information Technology (IT)",
    "Artificial Intelligence & Data Science (AI&DS)",
    "Electronics & Telecommunication (E&TC)",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Other",
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!geoData.state || !geoData.district || !geoData.college) {
      setError("Please ensure state, district, and college are selected.");
      return;
    }

    const finalBranch = branch === "Other" ? (customBranch.trim() || user?.branch || "Engineering") : branch;
    const finalCollege = geoData.college === "Other" ? geoData.customCollege.trim() : geoData.college;

    setSaving(true);
    try {
      const res = await updateProfile({
        fullName,
        yearOfStudy,
        branch: finalBranch,
        state: geoData.state,
        district: geoData.district,
        city: city.trim(),
        college: finalCollege,
        customCollege: geoData.college === "Other" ? geoData.customCollege : undefined,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setMessage("Profile updated successfully!");
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="text-center py-24 text-navy-800 text-sm">
        Loading profile details...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-6 p-6 sm:p-8 bg-white rounded-xl border border-cream-border shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-cream-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-cream-100 flex items-center justify-center text-navy-800 font-serif font-bold text-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-navy-900">
              Student Profile
            </h1>
            <p className="text-xs text-gray-500">
              Manage your academic credentials and verified institutional affiliations
            </p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center space-x-1 text-xs text-navy-700 hover:text-navy-900 bg-cream-50 px-3 py-1.5 rounded border border-cream-border transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
      </div>

      {message && (
        <div className="mb-6 p-3.5 bg-green-50 border border-green-200 rounded-md flex items-center space-x-2.5 text-sm text-green-800">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2.5 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
            Registered Email
          </label>
          <input
            type="email"
            disabled
            value={user.email}
            className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-border rounded-md text-gray-500 text-sm cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
            Full Name
          </label>
          <input
            id="profile-name-input"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
              Year of Study
            </label>
            <select
              id="profile-year-select"
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(e.target.value as YearOfStudy)}
              className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500 text-sm"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="Passed out">Passed out</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
              Branch / Department
            </label>
            <select
              id="profile-branch-select"
              value={branches.includes(branch) ? branch : "Other"}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500 text-sm"
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {branch === "Other" && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
              Specify Branch Name
            </label>
            <input
              type="text"
              required
              value={customBranch}
              onChange={(e) => setCustomBranch(e.target.value)}
              placeholder="e.g. Biomedical Engineering"
              className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500 text-sm"
            />
          </div>
        )}

        <div className="pt-2 border-t border-cream-border/60">
          <p className="text-xs font-medium text-navy-800 mb-2">
            Institutional Location & College (AISHE List)
          </p>
          <CollegeSelector
            initialState={geoData.state}
            initialDistrict={geoData.district}
            initialCollege={geoData.college}
            initialCustomCollege={geoData.customCollege}
            onChange={(vals) => setGeoData(vals)}
            required
          />

          <div className="mt-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
              City / Town <span className="text-gray-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="profile-city-input"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Pune, Kothrud (Optional)"
              className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500 text-sm transition"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            id="profile-save-button"
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 py-2.5 px-6 bg-navy-800 hover:bg-navy-700 text-cream-50 font-medium rounded-md shadow-sm transition disabled:opacity-60 text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
