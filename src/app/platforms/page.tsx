"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  PLATFORMS_CONFIG,
  PlatformId,
  PlatformConfig,
  getPlatformsForBranch,
} from "@/lib/platformsConfig";
import {
  Code,
  Github,
  Award,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Terminal,
  Trophy,
  Cpu,
  Wrench,
  Palette,
  Layers,
  Globe,
  SlidersHorizontal,
  Trash2,
  BookOpen,
  GraduationCap,
  Box,
  Lightbulb,
  Zap,
  Compass,
  Pencil,
  X,
  Search,
} from "lucide-react";

export default function PlatformsPage() {
  const { user, platformStats, updatePlatformStats } = useAuth();

  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  // Determine platforms filtered by user branch
  const branchPlatforms = useMemo(() => {
    return getPlatformsForBranch(user?.branch);
  }, [user?.branch]);

  const activePlatformsList = useMemo(() => {
    return showAllPlatforms ? Object.values(PLATFORMS_CONFIG) : branchPlatforms;
  }, [showAllPlatforms, branchPlatforms]);

  // Default selection to the first platform in the active list
  const [platform, setPlatform] = useState<PlatformId>(() => {
    const list = getPlatformsForBranch(user?.branch);
    return (list[0]?.id as PlatformId) || "github";
  });

  const [url, setUrl] = useState("");
  const [metric1Value, setMetric1Value] = useState("");
  const [metric2Value, setMetric2Value] = useState("");
  const [highlight, setHighlight] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  // Search & Category Filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Edit details modal state for non-public-API platforms
  const [editModalPlatform, setEditModalPlatform] = useState<PlatformId | null>(null);
  const [editModalData, setEditModalData] = useState<{
    metric1Label: string;
    metric1Value: string;
    metric2Label: string;
    metric2Value: string;
    highlight: string;
  } | null>(null);

  const currentPlatformConfig: PlatformConfig = PLATFORMS_CONFIG[platform] || PLATFORMS_CONFIG.github;

  const openEditDetails = (platId: PlatformId, existingData: any) => {
    const cfg = PLATFORMS_CONFIG[platId];
    setEditModalPlatform(platId);
    setEditModalData({
      metric1Label: existingData?.metric1Label || cfg?.defaultMetric1Label || "Projects",
      metric1Value: existingData?.metric1Value !== undefined ? String(existingData.metric1Value) : "",
      metric2Label: existingData?.metric2Label || cfg?.defaultMetric2Label || "Designs",
      metric2Value: existingData?.metric2Value !== undefined ? String(existingData.metric2Value) : "",
      highlight: existingData?.highlight || "",
    });
  };

  const handleSaveEditedDetails = async () => {
    if (!editModalPlatform || !editModalData) return;
    const current = platformStats?.[editModalPlatform];
    if (!current) return;

    const updated = {
      ...platformStats,
      [editModalPlatform]: {
        ...current,
        metric1Label: editModalData.metric1Label,
        metric1Value: editModalData.metric1Value,
        metric2Label: editModalData.metric2Label,
        metric2Value: editModalData.metric2Value,
        highlight: editModalData.highlight,
        last_updated: new Date().toISOString(),
      },
    };

    await updatePlatformStats(updated);
    setEditModalPlatform(null);
    setSyncSuccess(`Saved project details for ${PLATFORMS_CONFIG[editModalPlatform]?.name || editModalPlatform}!`);
  };

  const handleSync = async (e?: React.FormEvent, overridePlatform?: PlatformId, overrideUrl?: string) => {
    if (e) e.preventDefault();
    setSyncError(null);
    setSyncSuccess(null);

    const targetPlat = overridePlatform || platform;
    const targetUrl = (overrideUrl || url).trim();

    if (!targetUrl) {
      setSyncError("Please enter a profile URL.");
      return;
    }

    const targetConfig = PLATFORMS_CONFIG[targetPlat];
    if (!targetConfig) {
      setSyncError("Unsupported platform selected.");
      return;
    }

    // Client-side pre-validation with friendly error messages
    const preValidation = targetConfig.validateAndExtract(targetUrl);
    if (!preValidation.valid) {
      setSyncError(preValidation.error || `Please enter a valid ${targetConfig.name} profile URL.`);
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch("/api/platforms/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: targetPlat,
          url: targetUrl,
          metric1Label: targetConfig.defaultMetric1Label,
          metric1Value: metric1Value.trim() || undefined,
          metric2Label: targetConfig.defaultMetric2Label,
          metric2Value: metric2Value.trim() || undefined,
          highlight: highlight.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSyncError(data.error || "Couldn't fetch data from this link.");
        return;
      }

      const updated = {
        ...platformStats,
        [targetPlat]: data.stats,
      };

      await updatePlatformStats(updated);

      if (targetConfig.hasPublicStats) {
        setSyncSuccess(`Successfully synced live stats for ${targetConfig.name}!`);
      } else {
        setSyncSuccess(`Successfully linked your ${targetConfig.name} profile with project metrics!`);
      }

      if (!overrideUrl) {
        setUrl("");
        setMetric1Value("");
        setMetric2Value("");
        setHighlight("");
      }
    } catch {
      setSyncError("Couldn't fetch data from this link.");
    } finally {
      setSyncing(false);
    }
  };

  const handleUnlink = async (platformId: string) => {
    const updated = { ...platformStats };
    delete updated[platformId];
    await updatePlatformStats(updated);
    setSyncSuccess(`Unlinked ${PLATFORMS_CONFIG[platformId as PlatformId]?.name || platformId} profile.`);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "Never";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoString;
    }
  };

  const getPlatformIcon = (id: PlatformId) => {
    switch (id) {
      case "github":
        return <Github className="w-5 h-5 text-navy-900" />;
      case "leetcode":
        return <Code className="w-5 h-5 text-amber-600" />;
      case "codeforces":
        return <Trophy className="w-5 h-5 text-blue-600" />;
      case "hackerrank":
        return <Terminal className="w-5 h-5 text-emerald-600" />;
      case "credly":
        return <Award className="w-5 h-5 text-teal-600" />;
      case "tinkercad":
      case "wokwi":
      case "hackster":
        return <Cpu className="w-5 h-5 text-indigo-600" />;
      case "grabcad":
        return <Wrench className="w-5 h-5 text-orange-600" />;
      case "behance":
      case "dribbble":
        return <Palette className="w-5 h-5 text-pink-600" />;
      case "kaggle":
      case "codechef":
      case "geeksforgeeks":
        return <Globe className="w-5 h-5 text-cyan-600" />;
      case "googlescholar":
        return <GraduationCap className="w-5 h-5 text-blue-700" />;
      case "researchgate":
        return <BookOpen className="w-5 h-5 text-emerald-700" />;
      case "orcid":
        return <Award className="w-5 h-5 text-lime-600" />;
      case "thingiverse":
        return <Box className="w-5 h-5 text-sky-600" />;
      case "onshape":
        return <Layers className="w-5 h-5 text-blue-500" />;
      case "autodesk":
        return <Compass className="w-5 h-5 text-red-600" />;
      case "arduinohub":
        return <Cpu className="w-5 h-5 text-teal-600" />;
      case "instructables":
        return <Lightbulb className="w-5 h-5 text-amber-500" />;
      case "easyeda":
        return <Zap className="w-5 h-5 text-yellow-600" />;
      default:
        return <Layers className="w-5 h-5 text-navy-800" />;
    }
  };

  // Get list of cards to display: active filtered platforms + any already linked platforms
  const displayPlatforms = useMemo(() => {
    const set = new Set<PlatformId>();
    activePlatformsList.forEach((p) => set.add(p.id));
    // Also include any platforms that have already been linked by user
    Object.keys(platformStats || {}).forEach((k) => {
      if (platformStats[k] && PLATFORMS_CONFIG[k as PlatformId]) {
        set.add(k as PlatformId);
      }
    });
    return Array.from(set).map((id) => PLATFORMS_CONFIG[id]).filter(Boolean);
  }, [activePlatformsList, platformStats]);

  // Filter cards by search query and category tab
  const filteredDisplayPlatforms = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return displayPlatforms.filter((cfg) => {
      const data: any = platformStats?.[cfg.id];
      const matchesSearch =
        !q ||
        cfg.name.toLowerCase().includes(q) ||
        cfg.description.toLowerCase().includes(q) ||
        cfg.category.toLowerCase().includes(q) ||
        (data?.username || "").toLowerCase().includes(q) ||
        (data?.highlight || "").toLowerCase().includes(q) ||
        (data?.metric1Label || "").toLowerCase().includes(q) ||
        (data?.metric2Label || "").toLowerCase().includes(q);

      const matchesCat =
        categoryFilter === "all" || cfg.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [displayPlatforms, searchQuery, categoryFilter, platformStats]);

  return (
    <div className="py-2 space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-navy-800">
          <Terminal className="w-4 h-4 text-navy-700" />
          <span>Branch-Aware Engineering &amp; Design Profiles</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-navy-900 tracking-tight">
          Platform Profiles &amp; Metrics
        </h1>
        <p className="text-sm text-gray-600">
          Link your coding handles, hardware simulations (Tinkercad, Wokwi), CAD portfolios (GrabCAD), design repositories (Behance), and Credly certifications.
        </p>
      </div>

      {syncError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Notice</p>
            <p className="text-xs text-red-700 mt-0.5">{syncError}</p>
          </div>
        </div>
      )}

      {syncSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3 text-sm text-green-800">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span>{syncSuccess}</span>
        </div>
      )}

      {/* Add / Update Platform Link Form */}
      <div className="p-6 bg-white rounded-xl border border-cream-border shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-cream-border">
          <div>
            <h2 className="font-serif text-lg font-bold text-navy-900">
              Link a Platform Profile
            </h2>
            <p className="text-xs text-gray-500">
              {user?.branch ? (
                <span>
                  Defaulting to platforms for <strong>{user.branch}</strong>.
                </span>
              ) : (
                "Choose any engineering, coding, or design platform."
              )}
            </p>
          </div>

          {/* Toggle: Show All Platforms */}
          <button
            type="button"
            id="toggle-show-all-platforms"
            onClick={() => setShowAllPlatforms((prev) => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 border transition ${
              showAllPlatforms
                ? "bg-navy-800 text-cream-50 border-navy-800"
                : "bg-cream-100 text-navy-800 border-cream-border hover:bg-cream-200"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              {showAllPlatforms
                ? `Showing All Platforms (${Object.keys(PLATFORMS_CONFIG).length})`
                : "Show All Platforms"}
            </span>
          </button>
        </div>

        <form onSubmit={(e) => handleSync(e)} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
              Select Platform
            </label>
            <select
              id="platform-select"
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value as PlatformId);
                setSyncError(null);
                setSyncSuccess(null);
              }}
              className="w-full px-3 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
            >
              {activePlatformsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {!p.hasPublicStats ? "(Link & Showcase)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
              Profile URL (HTTPS only)
            </label>
            <input
              id="platform-url-input"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={currentPlatformConfig.placeholder}
              className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              id="sync-platform-button"
              type="submit"
              disabled={syncing}
              className="w-full py-2.5 px-4 bg-navy-800 hover:bg-navy-700 text-cream-50 text-xs font-semibold rounded-md shadow-sm transition disabled:opacity-60 flex items-center justify-center space-x-1.5"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>{currentPlatformConfig.hasPublicStats ? "Fetch & Sync Stats" : "Link & Showcase"}</span>
                </>
              )}
            </button>
          </div>

          {/* Optional Project Highlights / Metrics for Tinkercad, GrabCAD, Wokwi, etc. */}
          {!currentPlatformConfig.hasPublicStats && (
            <div className="sm:col-span-12 p-3 bg-cream-50/80 border border-cream-border rounded-lg space-y-2.5 mt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-navy-900">
                <span>Profile Project Details &amp; Metrics</span>
                <span className="text-[10px] text-gray-500 font-normal uppercase tracking-wider">Optional Showcase</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    {currentPlatformConfig.defaultMetric1Label || "Projects / Circuits"}
                  </label>
                  <input
                    type="text"
                    value={metric1Value}
                    onChange={(e) => setMetric1Value(e.target.value)}
                    placeholder="e.g., 12"
                    className="w-full px-2.5 py-1.5 bg-white border border-cream-border rounded text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    {currentPlatformConfig.defaultMetric2Label || "Designs / Models"}
                  </label>
                  <input
                    type="text"
                    value={metric2Value}
                    onChange={(e) => setMetric2Value(e.target.value)}
                    placeholder="e.g., 5"
                    className="w-full px-2.5 py-1.5 bg-white border border-cream-border rounded text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                </div>
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Highlight / Featured Project
                  </label>
                  <input
                    type="text"
                    value={highlight}
                    onChange={(e) => setHighlight(e.target.value)}
                    placeholder={currentPlatformConfig.highlightPlaceholder || "e.g., IoT Ultrasonic Radar System with Arduino"}
                    className="w-full px-2.5 py-1.5 bg-white border border-cream-border rounded text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-gray-500 gap-1 pt-1">
          <p>
            Example format: <code className="bg-cream-100 px-1 py-0.5 rounded text-navy-800 font-mono">{currentPlatformConfig.example}</code>
          </p>
          <p className="text-gray-400">
            {currentPlatformConfig.hasPublicStats ? "✓ Real-time public API integration" : "🔒 Linked profile (no public stats API)"}
          </p>
        </div>
      </div>

      {/* Search Bar & Category Filter Bar */}
      <div className="p-4 bg-white rounded-xl border border-cream-border shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="search-platforms-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search platforms by name, domain, project..."
              className="w-full pl-9 pr-8 py-2 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-xs focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs scrollbar-none">
            {[
              { id: "all", label: "All" },
              { id: "coding", label: "Coding" },
              { id: "hardware", label: "Hardware & IoT" },
              { id: "cad", label: "CAD & 3D" },
              { id: "design", label: "Design" },
              { id: "research", label: "Research" },
              { id: "cert", label: "Certifications" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-full font-medium transition text-xs whitespace-nowrap ${
                  categoryFilter === cat.id
                    ? "bg-navy-800 text-cream-50 shadow-2xs"
                    : "bg-cream-100 text-navy-800 hover:bg-cream-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Linked Platform Cards Grid */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-serif text-lg font-bold text-navy-900">
            Connected Profiles &amp; Repositories
          </h3>
          <span className="text-xs text-gray-500">
            Showing {filteredDisplayPlatforms.length} of {displayPlatforms.length} platforms
          </span>
        </div>

        {filteredDisplayPlatforms.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-cream-border text-gray-500 text-xs space-y-2">
            <p className="font-medium text-navy-900 text-sm">No platforms match &quot;{searchQuery}&quot;</p>
            <p>Try clearing your search query or selecting a different category filter.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
              }}
              className="text-xs text-navy-800 font-semibold underline pt-1"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDisplayPlatforms.map((cfg) => {
              const data: any = platformStats?.[cfg.id];
              const isLinked = Boolean(data && data.url);

            return (
              <div
                key={cfg.id}
                className="p-6 bg-white rounded-xl border border-cream-border shadow-sm flex flex-col justify-between space-y-4 hover:border-navy-200 transition"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-cream-border">
                    <div className="flex items-center space-x-2">
                      {getPlatformIcon(cfg.id)}
                      <h4 className="font-serif text-base font-bold text-navy-900">{cfg.name}</h4>
                    </div>
                    {isLinked && (
                      <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium border border-green-200">
                        Linked
                      </span>
                    )}
                  </div>

                  {/* Card Content: Live Stats vs Linked Profile */}
                  {isLinked && data ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-navy-900 font-medium">
                        <span className="text-gray-500">Handle / ID:</span>
                        <a
                          href={data.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center space-x-1 font-semibold text-navy-800"
                        >
                          <span>@{data.username || "profile"}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Dynamic Metrics if Available */}
                      {cfg.id === "github" && data.repos !== undefined && (
                        <div className="grid grid-cols-2 gap-3 text-center pt-2">
                          <div className="p-2 bg-cream-50 rounded border border-cream-border">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Public Repos</p>
                            <p className="font-serif text-xl font-bold text-navy-900 mt-0.5">{data.repos}</p>
                          </div>
                          <div className="p-2 bg-cream-50 rounded border border-cream-border">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Followers</p>
                            <p className="font-serif text-xl font-bold text-navy-900 mt-0.5">{data.followers}</p>
                          </div>
                        </div>
                      )}

                      {cfg.id === "leetcode" && data.totalSolved !== undefined && (
                        <div className="space-y-2 pt-1">
                          <div className="p-2 bg-cream-50 rounded border border-cream-border text-center">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Problems Solved</p>
                            <p className="font-serif text-2xl font-bold text-navy-900">{data.totalSolved}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                            <div className="p-1 bg-green-50 text-green-800 rounded border border-green-100">
                              <p className="text-[9px]">Easy</p>
                              <p className="font-bold text-xs">{data.easy}</p>
                            </div>
                            <div className="p-1 bg-amber-50 text-amber-800 rounded border border-amber-100">
                              <p className="text-[9px]">Medium</p>
                              <p className="font-bold text-xs">{data.medium}</p>
                            </div>
                            <div className="p-1 bg-red-50 text-red-800 rounded border border-red-100">
                              <p className="text-[9px]">Hard</p>
                              <p className="font-bold text-xs">{data.hard}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {cfg.id === "codeforces" && data.rating !== undefined && (
                        <div className="grid grid-cols-2 gap-2 text-center pt-1">
                          <div className="p-2 bg-cream-50 rounded border border-cream-border">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Rating</p>
                            <p className="font-serif text-lg font-bold text-navy-900">{data.rating}</p>
                            <p className="text-[9px] text-gray-500 capitalize">{data.rank}</p>
                          </div>
                          <div className="p-2 bg-cream-50 rounded border border-cream-border">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Solved</p>
                            <p className="font-serif text-lg font-bold text-navy-900">{data.solved}</p>
                            <p className="text-[9px] text-gray-500">Max: {data.maxRating}</p>
                          </div>
                        </div>
                      )}

                      {cfg.id === "hackerrank" && data.badges !== undefined && (
                        <div className="grid grid-cols-2 gap-2 text-center pt-1">
                          <div className="p-2 bg-cream-50 rounded border border-cream-border">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Badges</p>
                            <p className="font-serif text-xl font-bold text-navy-900">{data.badges}</p>
                          </div>
                          <div className="p-2 bg-cream-50 rounded border border-cream-border">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Stars</p>
                            <p className="font-serif text-xl font-bold text-navy-900">{data.stars}</p>
                          </div>
                        </div>
                      )}

                      {cfg.id === "credly" && data.badgeCount !== undefined && (
                        <div className="p-2.5 bg-cream-50 rounded border border-cream-border text-center">
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Verified Badges</p>
                          <p className="font-serif text-2xl font-bold text-navy-900">{data.badgeCount}</p>
                        </div>
                      )}

                      {/* Google Scholar Live Public Metrics */}
                      {cfg.id === "googlescholar" && data.citations !== undefined && (
                        <div className="space-y-2 pt-1">
                          {data.name && (
                            <div className="p-2 bg-cream-50 rounded border border-cream-border text-center">
                              <p className="text-xs font-serif font-bold text-navy-900">{data.name}</p>
                              {data.affiliation && (
                                <p className="text-[10px] text-gray-500 truncate mt-0.5">{data.affiliation}</p>
                              )}
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-1.5 text-center">
                            <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-100">
                              <p className="text-[9px] uppercase font-medium">Citations</p>
                              <p className="font-bold text-sm mt-0.5">{data.citations}</p>
                            </div>
                            <div className="p-1.5 bg-emerald-50 text-emerald-900 rounded border border-emerald-100">
                              <p className="text-[9px] uppercase font-medium">h-index</p>
                              <p className="font-bold text-sm mt-0.5">{data.hIndex}</p>
                            </div>
                            <div className="p-1.5 bg-purple-50 text-purple-900 rounded border border-purple-100">
                              <p className="text-[9px] uppercase font-medium">i10-index</p>
                              <p className="font-bold text-sm mt-0.5">{data.i10Index}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ORCID Live Public Metrics */}
                      {cfg.id === "orcid" && data.worksCount !== undefined && (
                        <div className="space-y-2 pt-1">
                          {data.name && (
                            <div className="p-2 bg-cream-50 rounded border border-cream-border text-center">
                              <p className="text-xs font-serif font-bold text-navy-900">{data.name}</p>
                              <p className="text-[10px] text-gray-500">Verified Researcher ID</p>
                            </div>
                          )}
                          <div className="p-2.5 bg-cream-50 rounded border border-cream-border text-center">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Public Works &amp; Publications</p>
                            <p className="font-serif text-2xl font-bold text-navy-900 mt-0.5">{data.worksCount}</p>
                          </div>
                        </div>
                      )}

                      {/* Project-Based Platforms (Tinkercad, GrabCAD, Behance, Wokwi, etc.) */}
                      {!cfg.hasPublicStats && (
                        <div className="space-y-2.5 pt-1">
                          {/* Metrics Box */}
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="p-2 bg-cream-50 rounded border border-cream-border">
                              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium truncate">
                                {data.metric1Label || cfg.defaultMetric1Label || "Projects"}
                              </p>
                              <p className="font-serif text-lg font-bold text-navy-900 mt-0.5">
                                {data.metric1Value || "—"}
                              </p>
                            </div>
                            <div className="p-2 bg-cream-50 rounded border border-cream-border">
                              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium truncate">
                                {data.metric2Label || cfg.defaultMetric2Label || "Designs"}
                              </p>
                              <p className="font-serif text-lg font-bold text-navy-900 mt-0.5">
                                {data.metric2Value || "—"}
                              </p>
                            </div>
                          </div>

                          {/* Highlight project if provided */}
                          {data.highlight && (
                            <div className="p-2 bg-navy-50/70 border border-navy-100 rounded text-xs text-navy-900">
                              <p className="text-[10px] font-semibold uppercase text-navy-700 tracking-wider">Highlight Project</p>
                              <p className="text-xs font-medium text-navy-900 mt-0.5 leading-snug">{data.highlight}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => openEditDetails(cfg.id, data)}
                              className="text-[11px] font-semibold text-navy-800 hover:text-navy-900 hover:underline flex items-center space-x-1"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>{data.metric1Value || data.highlight ? "Edit Details" : "+ Add Project Details"}</span>
                            </button>
                            <a
                              href={data.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-cream-100 border border-cream-border rounded text-[11px] font-semibold text-navy-800 transition shadow-2xs"
                            >
                              <span>Open {cfg.name}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {cfg.description}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPlatform(cfg.id);
                          setUrl("");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-xs text-navy-800 font-semibold hover:underline flex items-center space-x-1 pt-1"
                      >
                        <span>Link this profile &rarr;</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                {isLinked && data && (
                  <div className="pt-3 border-t border-cream-border flex items-center justify-between text-[11px] text-gray-500">
                    <span>Updated: {formatTime(data.last_updated)}</span>
                    <div className="flex items-center space-x-2">
                      {cfg.hasPublicStats && (
                        <button
                          onClick={() => handleSync(undefined, cfg.id, data.url)}
                          disabled={syncing}
                          className="text-navy-800 hover:text-navy-900 font-semibold hover:underline flex items-center space-x-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Refresh</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleUnlink(cfg.id)}
                        className="text-red-600 hover:text-red-700 font-semibold flex items-center space-x-0.5 hover:underline"
                        title="Unlink profile"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Unlink</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Edit Project Details Modal */}
      {editModalPlatform && editModalData && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-cream-border shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-cream-border">
              <div className="flex items-center space-x-2">
                {getPlatformIcon(editModalPlatform)}
                <h3 className="font-serif text-lg font-bold text-navy-900">
                  Edit {PLATFORMS_CONFIG[editModalPlatform]?.name} Details
                </h3>
              </div>
              <button
                onClick={() => setEditModalPlatform(null)}
                className="text-gray-400 hover:text-navy-900 p-1 rounded hover:bg-cream-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-navy-800 mb-1">
                  {editModalData.metric1Label || "Metric 1 Count"}
                </label>
                <input
                  type="text"
                  value={editModalData.metric1Value}
                  onChange={(e) =>
                    setEditModalData({ ...editModalData, metric1Value: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-cream-50 border border-cream-border rounded text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500"
                  placeholder="e.g., 12"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-navy-800 mb-1">
                  {editModalData.metric2Label || "Metric 2 Count"}
                </label>
                <input
                  type="text"
                  value={editModalData.metric2Value}
                  onChange={(e) =>
                    setEditModalData({ ...editModalData, metric2Value: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-cream-50 border border-cream-border rounded text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500"
                  placeholder="e.g., 5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-navy-800 mb-1">
                  Highlight / Showcase Project
                </label>
                <input
                  type="text"
                  value={editModalData.highlight}
                  onChange={(e) =>
                    setEditModalData({ ...editModalData, highlight: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-cream-50 border border-cream-border rounded text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500"
                  placeholder="e.g., IoT Ultrasonic Radar System with Arduino"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-cream-border">
              <button
                type="button"
                onClick={() => setEditModalPlatform(null)}
                className="px-3.5 py-2 border border-cream-border text-navy-800 text-xs font-semibold rounded hover:bg-cream-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedDetails}
                className="px-4 py-2 bg-navy-800 text-cream-50 text-xs font-semibold rounded hover:bg-navy-700 shadow-sm transition"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
