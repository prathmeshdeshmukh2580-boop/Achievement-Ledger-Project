"use client";

import React, { useEffect, useState, useRef } from "react";
import { Search, ChevronDown, Check, Building, AlertCircle } from "lucide-react";

interface CollegeSelectorProps {
  initialState?: string;
  initialDistrict?: string;
  initialCollege?: string;
  initialCustomCollege?: string;
  onChange: (values: {
    state: string;
    district: string;
    college: string;
    customCollege: string;
  }) => void;
  required?: boolean;
}

export default function CollegeSelector({
  initialState = "",
  initialDistrict = "",
  initialCollege = "",
  initialCustomCollege = "",
  onChange,
  required = true,
}: CollegeSelectorProps) {
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [colleges, setColleges] = useState<string[]>([]);
  const [totalCollegesCount, setTotalCollegesCount] = useState(0);

  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [selectedCollege, setSelectedCollege] = useState(initialCollege);
  const [customCollege, setCustomCollege] = useState(initialCustomCollege);

  const [searchQuery, setSearchQuery] = useState(initialCollege || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingColleges, setLoadingColleges] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Fetch States on mount
  useEffect(() => {
    async function loadStates() {
      try {
        const res = await fetch("/api/colleges?type=states");
        const data = await res.json();
        if (data.states) setStates(data.states);
      } catch (e) {
        console.error("Failed to load states:", e);
      }
    }
    loadStates();
  }, []);

  // 2. Fetch Districts when State changes
  useEffect(() => {
    if (!selectedState) {
      setDistricts([]);
      return;
    }
    async function loadDistricts() {
      setLoadingDistricts(true);
      try {
        const res = await fetch(`/api/colleges?type=districts&state=${encodeURIComponent(selectedState)}`);
        const data = await res.json();
        if (data.districts) setDistricts(data.districts);
      } catch (e) {
        console.error("Failed to load districts:", e);
      } finally {
        setLoadingDistricts(false);
      }
    }
    loadDistricts();
  }, [selectedState]);

  // 3. Fetch Colleges when State, District, or Search Query changes
  useEffect(() => {
    if (!selectedState || !selectedDistrict) {
      setColleges([]);
      setTotalCollegesCount(0);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingColleges(true);
      try {
        const queryParam = searchQuery && searchQuery !== selectedCollege ? `&q=${encodeURIComponent(searchQuery)}` : "";
        const res = await fetch(
          `/api/colleges?type=colleges&state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}${queryParam}&limit=100`
        );
        const data = await res.json();
        if (data.colleges) {
          setColleges(data.colleges);
          setTotalCollegesCount(data.total || data.colleges.length);
        }
      } catch (e) {
        console.error("Failed to load colleges:", e);
      } finally {
        setLoadingColleges(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedState, selectedDistrict, searchQuery, selectedCollege]);

  const notify = (s: string, d: string, col: string, custom: string) => {
    onChange({
      state: s,
      district: d,
      college: col,
      customCollege: custom,
    });
  };

  const handleStateSelect = (val: string) => {
    setSelectedState(val);
    setSelectedDistrict("");
    setSelectedCollege("");
    setSearchQuery("");
    setCustomCollege("");
    notify(val, "", "", "");
  };

  const handleDistrictSelect = (val: string) => {
    setSelectedDistrict(val);
    setSelectedCollege("");
    setSearchQuery("");
    setCustomCollege("");
    notify(selectedState, val, "", "");
  };

  const handleCollegePick = (picked: string) => {
    setSelectedCollege(picked);
    setSearchQuery(picked);
    setIsDropdownOpen(false);
    if (picked !== "Other") {
      setCustomCollege("");
    }
    notify(selectedState, selectedDistrict, picked, picked === "Other" ? customCollege : "");
  };

  const handleCustomCollegeChange = (val: string) => {
    setCustomCollege(val);
    notify(selectedState, selectedDistrict, selectedCollege, val);
  };

  return (
    <div className="space-y-4">
      {/* State Dropdown */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
          State {required && <span className="text-red-600">*</span>}
        </label>
        <select
          id="state-select"
          value={selectedState}
          onChange={(e) => handleStateSelect(e.target.value)}
          required={required}
          className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 text-sm transition"
        >
          <option value="">Select State</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* District Dropdown */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800 mb-1">
          District {required && <span className="text-red-600">*</span>}
        </label>
        <select
          id="district-select"
          value={selectedDistrict}
          onChange={(e) => handleDistrictSelect(e.target.value)}
          disabled={!selectedState || loadingDistricts}
          required={required}
          className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 disabled:bg-cream-100 disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 text-sm transition"
        >
          <option value="">
            {loadingDistricts
              ? "Loading districts..."
              : selectedState
              ? "Select District"
              : "Select State First"}
          </option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* College Type-to-Search Box */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-navy-800">
            College / Institution (AISHE List) {required && <span className="text-red-600">*</span>}
          </label>
          {selectedDistrict && totalCollegesCount > 0 && (
            <span className="text-[11px] text-gray-500">
              {totalCollegesCount} colleges in {selectedDistrict}
            </span>
          )}
        </div>

        <div className="relative">
          <input
            id="college-search-input"
            type="text"
            value={searchQuery}
            disabled={!selectedDistrict}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
              if (selectedCollege && selectedCollege !== "Other") {
                setSelectedCollege("");
              }
            }}
            onFocus={() => {
              if (selectedDistrict) setIsDropdownOpen(true);
            }}
            placeholder={
              !selectedDistrict
                ? "Select State and District first"
                : "Type to search your college name..."
            }
            className="w-full pl-9 pr-8 py-2.5 bg-cream-50 border border-cream-border rounded-md text-navy-900 disabled:bg-cream-100 disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-navy-500 focus:border-navy-500 text-sm transition"
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <button
            type="button"
            disabled={!selectedDistrict}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-900"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Dropdown Results */}
        {isDropdownOpen && selectedDistrict && (
          <div className="absolute z-50 mt-1 w-full bg-white rounded-md border border-cream-border shadow-lg max-h-60 overflow-y-auto py-1 text-xs">
            {loadingColleges && (
              <div className="p-3 text-center text-gray-400">Searching colleges...</div>
            )}

            {!loadingColleges && colleges.length === 0 && (
              <div className="p-3 text-center text-gray-500">
                No matching college found in {selectedDistrict}.
              </div>
            )}

            {!loadingColleges &&
              colleges.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => handleCollegePick(col)}
                  className={`w-full px-3.5 py-2 text-left hover:bg-cream-100 flex items-center justify-between transition ${
                    selectedCollege === col ? "bg-cream-100 font-semibold text-navy-900" : "text-gray-700"
                  }`}
                >
                  <span className="truncate pr-2">{col}</span>
                  {selectedCollege === col && <Check className="w-3.5 h-3.5 text-navy-800 flex-shrink-0" />}
                </button>
              ))}

            {/* Permanent "Other" Option */}
            <div className="border-t border-cream-border/60 mt-1 pt-1">
              <button
                type="button"
                onClick={() => handleCollegePick("Other")}
                className={`w-full px-3.5 py-2 text-left hover:bg-cream-100 font-medium text-navy-800 flex items-center justify-between ${
                  selectedCollege === "Other" ? "bg-cream-100 font-semibold" : ""
                }`}
              >
                <span>Other (type my college)</span>
                {selectedCollege === "Other" && <Check className="w-3.5 h-3.5 text-navy-800 flex-shrink-0" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom College Input if 'Other' selected */}
      {selectedCollege === "Other" && (
        <div className="p-3 bg-cream-100/70 rounded-md border border-cream-border space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-navy-800">
            Specify Full College Name {required && <span className="text-red-600">*</span>}
          </label>
          <input
            id="custom-college-input"
            type="text"
            required={required}
            value={customCollege}
            onChange={(e) => handleCustomCollegeChange(e.target.value)}
            placeholder="Type your official college / institution name"
            className="w-full px-3.5 py-2 bg-white border border-cream-border rounded text-navy-900 text-sm focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>
      )}
    </div>
  );
}
