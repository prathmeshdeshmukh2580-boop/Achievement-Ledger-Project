"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AchievementCategory, AchievementType } from "@/types";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export default function ExtractPage() {
  const router = useRouter();
  const { user, addAchievement } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Review Form States (populated from AI)
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [title, setTitle] = useState("");
  const [eventName, setEventName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [category, setCategory] = useState<AchievementCategory>("Certification");
  const [achievementType, setAchievementType] = useState<AchievementType>("completion");
  const [position, setPosition] = useState("");
  const [date, setDate] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [platform, setPlatform] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [savedFileUrl, setSavedFileUrl] = useState<string | null>(null);

  const categories: AchievementCategory[] = [
    "Hackathon",
    "Competition",
    "Course",
    "Certification",
    "Sports",
    "Academic",
    "Cultural",
    "Other",
  ];

  const achievementTypes: AchievementType[] = [
    "winner",
    "runner_up",
    "finalist",
    "position",
    "participation",
    "completion",
    "other",
  ];

  const handleFileSelect = (selectedFile: File) => {
    setExtractError(null);
    setExtractedData(null);

    // Validate size (10 MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setExtractError("File size exceeds 10 MB. Please upload a smaller file.");
      return;
    }

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
    if (!validTypes.includes(selectedFile.type.toLowerCase())) {
      setExtractError("Unsupported file type. Please upload a PNG, JPG, or PDF certificate.");
      return;
    }

    setFile(selectedFile);
    if (selectedFile.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const recomputeSummary = (
    typeVal: string,
    posVal: string,
    eventVal: string,
    issuerVal: string,
    titleVal: string
  ) => {
    const e = eventVal.trim() || titleVal.trim() || "Event";
    const i = issuerVal.trim() ? ` (${issuerVal.trim()})` : "";
    if (typeVal === "winner" || typeVal === "runner_up" || typeVal === "finalist" || typeVal === "position") {
      if (posVal.trim()) {
        return `${posVal.trim()} at ${e}${i}`;
      }
      return `Winner at ${e}${i}`;
    } else if (typeVal === "participation") {
      return `Participated in ${e}${i}`;
    } else if (typeVal === "completion") {
      return `Completed ${titleVal.trim() || e} by ${issuerVal.trim() || "Organizer"}`;
    }
    return `${titleVal.trim() || e}${i}`;
  };

  const handleExtract = async () => {
    if (!file) return;
    setExtracting(true);
    setExtractError(null);
    setExtractedData(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setExtractError(data.error || "Failed to extract details from certificate.");
        return;
      }

      const ext = data.extracted;
      setExtractedData(ext);
      setTitle(ext.achievement_title || "");
      setEventName(ext.event_name || "");
      setIssuer(ext.issuer || "");
      setCategory(ext.category || "Certification");
      setAchievementType(ext.achievement_type || "completion");
      setPosition(ext.position || "");
      setDate(ext.date || "");
      setRecipientName(ext.recipient_name || "");
      setCredentialId(ext.credential_id || "");
      setPlatform(ext.platform || "");
      setVerificationUrl(ext.verification_url || "");
      setSummary(ext.summary || "");
      setSavedFileUrl(ext.file_url || null);
    } catch (err: any) {
      setExtractError("Network or server error while connecting to extraction service.");
    } finally {
      setExtracting(false);
    }
  };

  const handleConfirmAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setExtractError("Please sign in to save your achievement to your ledger.");
      return;
    }

    if (!title && !eventName) {
      setExtractError("Please provide an achievement title or event name.");
      return;
    }

    setSaving(true);
    try {
      const finalSummary = summary || recomputeSummary(achievementType, position, eventName, issuer, title);

      const res = await addAchievement({
        achievement_title: title.trim() || eventName.trim(),
        event_name: eventName.trim() || title.trim(),
        issuer: issuer.trim() || "Independent",
        category,
        achievement_type: achievementType,
        position: position.trim() || null,
        date: date.trim() || new Date().toISOString().split("T")[0],
        recipient_name: recipientName.trim() || user.fullName,
        credential_id: credentialId.trim() || null,
        platform: platform.trim() || null,
        verification_url: verificationUrl.trim() || null,
        summary: finalSummary,
        file_url: savedFileUrl,
        file_name: file?.name || "certificate.png",
      });

      if (res.error) {
        setExtractError(res.error);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setExtractError("Failed to save achievement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2 text-xs font-semibold text-navy-800 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Multimodal Vision Extraction</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-navy-900 tracking-tight">
          Extract Certificate Details
        </h1>
        <p className="text-sm text-gray-600">
          Upload any certificate (PNG, JPG, or PDF up to 10 MB). Gemini vision reads details into an editable review form for student verification.
        </p>
      </div>

      {extractError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Extraction Notice</p>
            <p className="text-xs text-red-700 mt-0.5">{extractError}</p>
          </div>
        </div>
      )}

      {/* Step 1: Upload Card */}
      {!extractedData && (
        <div className="p-8 bg-white rounded-xl border border-dashed border-cream-border hover:border-navy-500 transition text-center space-y-4 shadow-sm">
          <div className="mx-auto w-14 h-14 rounded-full bg-cream-100 flex items-center justify-center text-navy-800">
            <Upload className="w-7 h-7" />
          </div>

          <div>
            <label
              htmlFor="certificate-upload"
              className="cursor-pointer inline-flex items-center space-x-2 px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-cream-50 font-medium rounded-md shadow-sm transition text-sm"
            >
              <span>Choose Certificate File</span>
            </label>
            <input
              id="certificate-upload"
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
              }}
            />
            <p className="text-xs text-gray-500 mt-2">
              Supports PNG, JPG, or PDF (Max 10 MB)
            </p>
          </div>

          {file && (
            <div className="mt-4 p-4 bg-cream-50 rounded-lg border border-cream-border max-w-md mx-auto flex items-center justify-between text-left">
              <div className="flex items-center space-x-3 truncate">
                <FileText className="w-5 h-5 text-navy-700 flex-shrink-0" />
                <div className="truncate text-xs">
                  <p className="font-semibold text-navy-900 truncate">{file.name}</p>
                  <p className="text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                id="start-extract-button"
                onClick={handleExtract}
                disabled={extracting}
                className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-cream-50 text-xs font-semibold rounded shadow-sm transition disabled:opacity-60 flex items-center space-x-1.5 flex-shrink-0"
              >
                {extracting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Extraction</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Verification and Review Form */}
      {extractedData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Certificate Preview Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 bg-white rounded-xl border border-cream-border shadow-sm space-y-3 sticky top-20">
              <div className="flex items-center justify-between pb-2 border-b border-cream-border">
                <h3 className="font-serif text-base font-bold text-navy-900 flex items-center space-x-1.5">
                  <Eye className="w-4 h-4 text-navy-700" />
                  <span>Original Document</span>
                </h3>
                <button
                  onClick={() => {
                    setExtractedData(null);
                    setFile(null);
                  }}
                  className="text-xs text-navy-700 hover:underline"
                >
                  Upload different file
                </button>
              </div>

              {previewUrl ? (
                <div className="rounded-lg overflow-hidden border border-cream-border bg-cream-50 max-h-[420px] flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Certificate preview"
                    className="w-full h-auto object-contain max-h-[400px]"
                  />
                </div>
              ) : (
                <div className="p-10 bg-cream-50 rounded-lg text-center text-xs text-gray-500 border border-cream-border">
                  <FileText className="w-10 h-10 mx-auto text-navy-800/40 mb-2" />
                  <p className="font-medium text-navy-900">{file?.name}</p>
                  <p className="text-[11px] text-gray-400 mt-1">PDF Document attached to record</p>
                </div>
              )}

              <div className="p-3 bg-cream-100/60 rounded-md text-[11px] text-navy-800 space-y-1">
                <div className="flex items-center space-x-1.5 font-semibold text-navy-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-navy-800" />
                  <span>Student Verification Step</span>
                </div>
                <p>
                  Review all fields on the right. Nothing is saved until you confirm.
                </p>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleConfirmAndSave}
              className="p-6 sm:p-8 bg-white rounded-xl border border-cream-border shadow-sm space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-cream-border">
                <div>
                  <h2 className="font-serif text-xl font-bold text-navy-900">
                    Review Extracted Details
                  </h2>
                  <p className="text-xs text-gray-500">
                    Fields marked with badge are auto-filled by Gemini AI. Edit any field as needed.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-semibold bg-cream-200 text-navy-900 rounded-full border border-cream-border flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-700" />
                  <span>Auto-filled</span>
                </span>
              </div>

              {/* Achievement Title */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-navy-800">
                    Achievement / Course Title <span className="text-red-600">*</span>
                  </label>
                  <span className="text-[10px] text-amber-800 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    auto-filled, please check
                  </span>
                </div>
                <input
                  id="extracted-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setSummary(recomputeSummary(achievementType, position, eventName, issuer, e.target.value));
                  }}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
                />
              </div>

              {/* Event Name & Issuer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-navy-800">
                      Event / Contest Name
                    </label>
                    <span className="text-[10px] text-amber-800 bg-amber-50 px-1 rounded">
                      check
                    </span>
                  </div>
                  <input
                    id="extracted-event-input"
                    type="text"
                    value={eventName}
                    onChange={(e) => {
                      setEventName(e.target.value);
                      setSummary(recomputeSummary(achievementType, position, e.target.value, issuer, title));
                    }}
                    className="w-full px-3.5 py-2 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-navy-800">
                      Issuer / Organizing Body
                    </label>
                    <span className="text-[10px] text-amber-800 bg-amber-50 px-1 rounded">
                      check
                    </span>
                  </div>
                  <input
                    id="extracted-issuer-input"
                    type="text"
                    value={issuer}
                    onChange={(e) => {
                      setIssuer(e.target.value);
                      setSummary(recomputeSummary(achievementType, position, eventName, e.target.value, title));
                    }}
                    className="w-full px-3.5 py-2 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                </div>
              </div>

              {/* Category & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
                    Category
                  </label>
                  <select
                    id="extracted-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AchievementCategory)}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
                    Achievement Type
                  </label>
                  <select
                    id="extracted-type-select"
                    value={achievementType}
                    onChange={(e) => {
                      const newType = e.target.value as AchievementType;
                      setAchievementType(newType);
                      setSummary(recomputeSummary(newType, position, eventName, issuer, title));
                    }}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
                  >
                    {achievementTypes.map((t) => (
                      <option key={t} value={t}>
                        {t.replace("_", " ").toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Position & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-navy-800">
                      Position / Rank (if any)
                    </label>
                    <span className="text-[10px] text-gray-500">e.g. 1st Place</span>
                  </div>
                  <input
                    id="extracted-position-input"
                    type="text"
                    placeholder="e.g. 1st Place, Top 10, or leave blank"
                    value={position}
                    onChange={(e) => {
                      setPosition(e.target.value);
                      setSummary(recomputeSummary(achievementType, e.target.value, eventName, issuer, title));
                    }}
                    className="w-full px-3.5 py-2 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
                    Date of Issue / Event
                  </label>
                  <input
                    id="extracted-date-input"
                    type="text"
                    placeholder="dd-mm-yyyy"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                </div>
              </div>

              {/* Recipient Name & Credential ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
                    Recipient Name
                  </label>
                  <input
                    id="extracted-recipient-input"
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
                    Credential ID / Certificate #
                  </label>
                  <input
                    id="extracted-credential-input"
                    type="text"
                    placeholder="Optional certificate ID"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                </div>
              </div>

              {/* Verification URL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
                  Public Verification Link / Credential URL
                </label>
                <input
                  id="extracted-verification-input"
                  type="url"
                  placeholder="https://..."
                  value={verificationUrl}
                  onChange={(e) => setVerificationUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
                />
              </div>

              {/* One-Line Achievement Summary (Auto-Generated) */}
              <div className="p-4 bg-cream-100/60 rounded-lg border border-cream-border space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-navy-800">
                    Generated One-Line Summary (for Resumes)
                  </label>
                  <span className="text-[10px] text-navy-700/70 font-medium">Editable</span>
                </div>
                <input
                  id="extracted-summary-input"
                  type="text"
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-cream-border rounded text-navy-900 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-navy-500"
                />
              </div>

              {/* Confirm & Save Button */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setExtractedData(null)}
                  className="px-4 py-2.5 text-xs text-navy-800 hover:bg-cream-100 rounded transition font-medium"
                >
                  Cancel
                </button>
                <button
                  id="confirm-and-save-button"
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-navy-800 hover:bg-navy-700 text-cream-50 text-xs font-semibold rounded-md shadow-sm transition disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saving ? "Saving to Ledger..." : "Confirm & Save to Ledger"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
