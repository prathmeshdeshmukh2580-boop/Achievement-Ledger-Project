"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CollegeSelector from "@/components/CollegeSelector";
import { YearOfStudy } from "@/types";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState<YearOfStudy>("2nd Year");
  const [branch, setBranch] = useState("Computer Science & Business Systems (CSBS)");
  const [customBranch, setCustomBranch] = useState("");

  const [geoData, setGeoData] = useState({
    state: "",
    district: "",
    college: "",
    customCollege: "",
  });
  const [city, setCity] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!geoData.state || !geoData.district || !geoData.college) {
      setError("Please complete state, district, and college fields.");
      return;
    }

    if (geoData.college === "Other" && !geoData.customCollege.trim()) {
      setError("Please type the name of your college.");
      return;
    }

    const finalBranch = branch === "Other" ? (customBranch.trim() || "Engineering") : branch;
    const finalCollege = geoData.college === "Other" ? geoData.customCollege.trim() : geoData.college;

    setLoading(true);
    try {
      const res = await signUp(email, password, {
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
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-6 p-6 sm:p-8 bg-white rounded-xl border border-cream-border shadow-sm">
      <div className="text-center mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy-900 tracking-tight">
          Create Student Account
        </h1>
        <p className="mt-1.5 text-sm text-gray-600">
          Join Achievement Hub to extract, organize, and showcase your credentials
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2.5 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
            Full Name <span className="text-red-600">*</span>
          </label>
          <input
            id="full-name-input"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Prathmesh Deshmukh"
            className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 text-sm transition"
          />
        </div>

        {/* Email & Password Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
              Email Address <span className="text-red-600">*</span>
            </label>
            <input
              id="email-input"
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
              Password <span className="text-red-600">*</span>
            </label>
            <input
              id="password-input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 text-sm transition"
            />
          </div>
        </div>

        {/* Year of Study & Branch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
              Year of Study <span className="text-red-600">*</span>
            </label>
            <select
              id="year-select"
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(e.target.value as YearOfStudy)}
              required
              className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 text-sm transition"
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
              Branch / Department <span className="text-red-600">*</span>
            </label>
            <select
              id="branch-select"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 text-sm transition"
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
              Specify Branch Name <span className="text-red-600">*</span>
            </label>
            <input
              id="custom-branch-input"
              type="text"
              required
              value={customBranch}
              onChange={(e) => setCustomBranch(e.target.value)}
              placeholder="e.g. Biomedical Engineering"
              className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500 text-sm"
            />
          </div>
        )}

        {/* Cascading Dropdowns for State -> District -> College */}
        <div className="pt-2 border-t border-cream-border/60">
          <p className="text-xs font-medium text-navy-800 mb-2">
            Institutional Location & College (Cascading AISHE List)
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
              id="signup-city-input"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Pune, Kothrud (Optional)"
              className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500 text-sm transition"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            id="signup-submit-button"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-navy-800 hover:bg-navy-700 text-cream-50 font-medium rounded-md shadow-sm transition disabled:opacity-60"
          >
            <span>{loading ? "Creating Account..." : "Create Account & Get Started"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-xs text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-navy-800 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
