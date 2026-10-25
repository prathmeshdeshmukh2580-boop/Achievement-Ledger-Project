"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
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
} from "lucide-react";

export default function PlatformsPage() {
  const { user, platformStats, updatePlatformStats } = useAuth();

  const [platform, setPlatform] = useState<string>("github");
  const [url, setUrl] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const platformMeta: Record<string, { name: string; placeholder: string; example: string }> = {
    github: {
      name: "GitHub",
      placeholder: "https://github.com/username",
      example: "https://github.com/torvalds",
    },
    leetcode: {
      name: "LeetCode",
      placeholder: "https://leetcode.com/u/username",
      example: "https://leetcode.com/u/neal_wu",
    },
    codeforces: {
      name: "Codeforces",
      placeholder: "https://codeforces.com/profile/handle",
      example: "https://codeforces.com/profile/tourist",
    },
    hackerrank: {
      name: "HackerRank",
      placeholder: "https://www.hackerrank.com/profile/username",
      example: "https://www.hackerrank.com/profile/genghiskhan",
    },
    credly: {
      name: "Credly",
      placeholder: "https://www.credly.com/users/username",
      example: "https://www.credly.com/users/satyanadella",
    },
  };

  const handleSync = async (e?: React.FormEvent, overridePlatform?: string, overrideUrl?: string) => {
    if (e) e.preventDefault();
    setSyncError(null);
    setSyncSuccess(null);

    const targetPlat = overridePlatform || platform;
    const targetUrl = overrideUrl || url;

    if (!targetUrl.trim()) {
      setSyncError("Please enter a profile URL.");
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch("/api/platforms/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: targetPlat, url: targetUrl.trim() }),
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
      setSyncSuccess(`Successfully synced live stats for ${platformMeta[targetPlat].name}!`);
      if (!overrideUrl) setUrl("");
    } catch {
      setSyncError("Couldn't fetch data from this link.");
    } finally {
      setSyncing(false);
    }
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

  return (
    <div className="py-2 space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-navy-800">
          <Terminal className="w-4 h-4 text-navy-700" />
          <span>Live Metrics Integration</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-navy-900 tracking-tight">
          Platform Profiles &amp; Stats
        </h1>
        <p className="text-sm text-gray-600">
          Connect your competitive programming, open source, and certification handles. Verified metrics are fetched server-side and updated directly onto your resume.
        </p>
      </div>

      {syncError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Sync Notice</p>
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
      <div className="p-6 bg-white rounded-xl border border-cream-border shadow-sm space-y-4">
        <h2 className="font-serif text-lg font-bold text-navy-900">
          Link a Platform Profile
        </h2>

        <form onSubmit={(e) => handleSync(e)} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
              Select Platform
            </label>
            <select
              id="platform-select"
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value);
                setSyncError(null);
              }}
              className="w-full px-3 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
            >
              <option value="github">GitHub</option>
              <option value="leetcode">LeetCode</option>
              <option value="codeforces">Codeforces</option>
              <option value="hackerrank">HackerRank</option>
              <option value="credly">Credly</option>
            </select>
          </div>

          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
              Profile URL (HTTPS only)
            </label>
            <input
              id="platform-url-input"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={platformMeta[platform].placeholder}
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
                  <span>Fetching Data...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Fetch &amp; Sync Stats</span>
                </>
              )}
            </button>
          </div>
        </form>
        <p className="text-[11px] text-gray-500">
          Example format: <code className="bg-cream-100 px-1 py-0.5 rounded text-navy-800">{platformMeta[platform].example}</code>
        </p>
      </div>

      {/* Linked Platform Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* GitHub Card */}
        <div className="p-6 bg-white rounded-xl border border-cream-border shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cream-border">
              <div className="flex items-center space-x-2">
                <Github className="w-5 h-5 text-navy-900" />
                <h3 className="font-serif text-lg font-bold text-navy-900">GitHub</h3>
              </div>
              {platformStats.github && (
                <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium border border-green-200">
                  Linked
                </span>
              )}
            </div>

            {platformStats.github ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-navy-900 font-medium">
                  <span className="text-gray-500">Username:</span>
                  <a
                    href={platformStats.github.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center space-x-1 font-semibold"
                  >
                    <span>@{platformStats.github.username}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center pt-2">
                  <div className="p-2.5 bg-cream-50 rounded border border-cream-border">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Public Repos</p>
                    <p className="font-serif text-xl font-bold text-navy-900 mt-0.5">{platformStats.github.repos}</p>
                  </div>
                  <div className="p-2.5 bg-cream-50 rounded border border-cream-border">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Followers</p>
                    <p className="font-serif text-xl font-bold text-navy-900 mt-0.5">{platformStats.github.followers}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                Connect your GitHub profile above to show public repositories, followers, and open-source impact.
              </p>
            )}
          </div>

          {platformStats.github && (
            <div className="pt-3 border-t border-cream-border flex items-center justify-between text-[11px] text-gray-500">
              <span>Updated: {formatTime(platformStats.github.last_updated)}</span>
              <button
                onClick={() => handleSync(undefined, "github", platformStats.github?.url)}
                disabled={syncing}
                className="text-navy-800 hover:text-navy-900 font-semibold hover:underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
          )}
        </div>

        {/* LeetCode Card */}
        <div className="p-6 bg-white rounded-xl border border-cream-border shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cream-border">
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-amber-600" />
                <h3 className="font-serif text-lg font-bold text-navy-900">LeetCode</h3>
              </div>
              {platformStats.leetcode && (
                <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium border border-green-200">
                  Linked
                </span>
              )}
            </div>

            {platformStats.leetcode ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-navy-900 font-medium">
                  <span className="text-gray-500">Username:</span>
                  <a
                    href={platformStats.leetcode.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center space-x-1 font-semibold"
                  >
                    <span>@{platformStats.leetcode.username}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="p-2.5 bg-cream-50 rounded border border-cream-border text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Total Solved</p>
                  <p className="font-serif text-2xl font-bold text-navy-900">{platformStats.leetcode.totalSolved}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-1.5 bg-green-50 text-green-800 rounded border border-green-100">
                    <p className="text-[10px]">Easy</p>
                    <p className="font-bold">{platformStats.leetcode.easy}</p>
                  </div>
                  <div className="p-1.5 bg-amber-50 text-amber-800 rounded border border-amber-100">
                    <p className="text-[10px]">Medium</p>
                    <p className="font-bold">{platformStats.leetcode.medium}</p>
                  </div>
                  <div className="p-1.5 bg-red-50 text-red-800 rounded border border-red-100">
                    <p className="text-[10px]">Hard</p>
                    <p className="font-bold">{platformStats.leetcode.hard}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                Connect your LeetCode handle to showcase total solved count along with Easy, Medium, and Hard problem breakdowns.
              </p>
            )}
          </div>

          {platformStats.leetcode && (
            <div className="pt-3 border-t border-cream-border flex items-center justify-between text-[11px] text-gray-500">
              <span>Updated: {formatTime(platformStats.leetcode.last_updated)}</span>
              <button
                onClick={() => handleSync(undefined, "leetcode", platformStats.leetcode?.url)}
                disabled={syncing}
                className="text-navy-800 hover:text-navy-900 font-semibold hover:underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
          )}
        </div>

        {/* Codeforces Card */}
        <div className="p-6 bg-white rounded-xl border border-cream-border shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cream-border">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-blue-600" />
                <h3 className="font-serif text-lg font-bold text-navy-900">Codeforces</h3>
              </div>
              {platformStats.codeforces && (
                <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium border border-green-200">
                  Linked
                </span>
              )}
            </div>

            {platformStats.codeforces ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-navy-900 font-medium">
                  <span className="text-gray-500">Handle:</span>
                  <a
                    href={platformStats.codeforces.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center space-x-1 font-semibold"
                  >
                    <span>{platformStats.codeforces.username}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="p-2 bg-cream-50 rounded border border-cream-border">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Current Rating</p>
                    <p className="font-serif text-lg font-bold text-navy-900">{platformStats.codeforces.rating}</p>
                    <p className="text-[10px] text-gray-500 capitalize">{platformStats.codeforces.rank}</p>
                  </div>
                  <div className="p-2 bg-cream-50 rounded border border-cream-border">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Problems Solved</p>
                    <p className="font-serif text-lg font-bold text-navy-900">{platformStats.codeforces.solved}</p>
                    <p className="text-[10px] text-gray-500">Max: {platformStats.codeforces.maxRating}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                Display competitive programming rating, rank title, and problem count from Codeforces.
              </p>
            )}
          </div>

          {platformStats.codeforces && (
            <div className="pt-3 border-t border-cream-border flex items-center justify-between text-[11px] text-gray-500">
              <span>Updated: {formatTime(platformStats.codeforces.last_updated)}</span>
              <button
                onClick={() => handleSync(undefined, "codeforces", platformStats.codeforces?.url)}
                disabled={syncing}
                className="text-navy-800 hover:text-navy-900 font-semibold hover:underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
          )}
        </div>

        {/* HackerRank Card */}
        <div className="p-6 bg-white rounded-xl border border-cream-border shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cream-border">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif text-lg font-bold text-navy-900">HackerRank</h3>
              </div>
              {platformStats.hackerrank && (
                <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium border border-green-200">
                  Linked
                </span>
              )}
            </div>

            {platformStats.hackerrank ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-navy-900 font-medium">
                  <span className="text-gray-500">Profile:</span>
                  <a
                    href={platformStats.hackerrank.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center space-x-1 font-semibold"
                  >
                    <span>@{platformStats.hackerrank.username}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center pt-2">
                  <div className="p-2 bg-cream-50 rounded border border-cream-border">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Badges Earned</p>
                    <p className="font-serif text-xl font-bold text-navy-900">{platformStats.hackerrank.badges}</p>
                  </div>
                  <div className="p-2 bg-cream-50 rounded border border-cream-border">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Total Stars</p>
                    <p className="font-serif text-xl font-bold text-navy-900">{platformStats.hackerrank.stars}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                Track domain skill badges and stars earned on HackerRank.
              </p>
            )}
          </div>

          {platformStats.hackerrank && (
            <div className="pt-3 border-t border-cream-border flex items-center justify-between text-[11px] text-gray-500">
              <span>Updated: {formatTime(platformStats.hackerrank.last_updated)}</span>
              <button
                onClick={() => handleSync(undefined, "hackerrank", platformStats.hackerrank?.url)}
                disabled={syncing}
                className="text-navy-800 hover:text-navy-900 font-semibold hover:underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
          )}
        </div>

        {/* Credly Card */}
        <div className="p-6 bg-white rounded-xl border border-cream-border shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cream-border">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-teal-600" />
                <h3 className="font-serif text-lg font-bold text-navy-900">Credly</h3>
              </div>
              {platformStats.credly && (
                <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium border border-green-200">
                  Linked
                </span>
              )}
            </div>

            {platformStats.credly ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-navy-900 font-medium">
                  <span className="text-gray-500">Profile:</span>
                  <a
                    href={platformStats.credly.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center space-x-1 font-semibold"
                  >
                    <span>@{platformStats.credly.username}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="p-3 bg-cream-50 rounded border border-cream-border text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Verified Digital Badges</p>
                  <p className="font-serif text-2xl font-bold text-navy-900">{platformStats.credly.badgeCount}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                Display verified industry certifications and digital badges from Microsoft, AWS, IBM, and Oracle hosted on Credly.
              </p>
            )}
          </div>

          {platformStats.credly && (
            <div className="pt-3 border-t border-cream-border flex items-center justify-between text-[11px] text-gray-500">
              <span>Updated: {formatTime(platformStats.credly.last_updated)}</span>
              <button
                onClick={() => handleSync(undefined, "credly", platformStats.credly?.url)}
                disabled={syncing}
                className="text-navy-800 hover:text-navy-900 font-semibold hover:underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
