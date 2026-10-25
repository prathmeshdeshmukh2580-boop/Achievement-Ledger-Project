import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import readline from "readline";

interface CollegeRecord {
  state: string;
  district: string;
  city: string;
  college_name: string;
}

// In-memory cache loaded once on server
let cachedRecords: CollegeRecord[] | null = null;
let stateList: string[] = [];
let stateDistrictMap: Map<string, Set<string>> = new Map();
let stateDistrictCollegesMap: Map<string, string[]> = new Map();

function ensureLoaded() {
  if (cachedRecords !== null) return;

  const records: CollegeRecord[] = [];
  const sSet = new Set<string>();
  const sdMap = new Map<string, Set<string>>();
  const sdcMap = new Map<string, string[]>();

  let csvPath = path.join(process.cwd(), "data", "colleges.csv");
  if (!fs.existsSync(csvPath)) {
    csvPath = path.join(process.cwd(), "public", "data", "colleges.csv");
  }

  if (!fs.existsSync(csvPath)) {
    cachedRecords = [];
    return;
  }

  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split(/\r?\n/);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith("#")) continue;

    // Fast CSV parsing
    const parts: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        parts.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    parts.push(current);

    if (parts.length >= 4) {
      const state = parts[0].trim();
      const district = parts[1].trim();
      const city = parts[2].trim();
      const college_name = parts[3].trim();

      if (state && district && college_name) {
        records.push({ state, district, city, college_name });

        sSet.add(state);

        if (!sdMap.has(state)) sdMap.set(state, new Set());
        sdMap.get(state)!.add(district);

        const key = `${state.toLowerCase()}:::${district.toLowerCase()}`;
        if (!sdcMap.has(key)) sdcMap.set(key, []);
        sdcMap.get(key)!.push(college_name);
      }
    }
  }

  cachedRecords = records;
  stateList = Array.from(sSet).sort();
  stateDistrictMap = sdMap;
  stateDistrictCollegesMap = sdcMap;
}

export async function GET(req: NextRequest) {
  try {
    ensureLoaded();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const state = searchParams.get("state") || "";
    const district = searchParams.get("district") || "";
    const query = (searchParams.get("q") || "").toLowerCase().trim();

    // 1. Get States list
    if (type === "states" || !type) {
      return NextResponse.json({ states: stateList });
    }

    // 2. Get Districts for State
    if (type === "districts") {
      if (!state) return NextResponse.json({ districts: [] });
      const foundState = stateList.find(s => s.toLowerCase() === state.toLowerCase());
      if (!foundState || !stateDistrictMap.has(foundState)) {
        return NextResponse.json({ districts: [] });
      }
      const districts = Array.from(stateDistrictMap.get(foundState)!).sort();
      return NextResponse.json({ districts });
    }

    // 3. Get Colleges for State + District (with type-to-search query)
    if (type === "colleges") {
      if (!state || !district) return NextResponse.json({ colleges: [] });

      const key = `${state.toLowerCase()}:::${district.toLowerCase()}`;
      const colleges = stateDistrictCollegesMap.get(key) || [];

      let filtered = colleges;
      if (query) {
        filtered = colleges.filter(c => c.toLowerCase().includes(query));
      }

      // Limit response to avoid overwhelming client (default max 200 matches)
      const limit = parseInt(searchParams.get("limit") || "150", 10);
      const results = filtered.slice(0, limit);

      return NextResponse.json({
        total: filtered.length,
        colleges: results,
      });
    }

    return NextResponse.json({ states: stateList });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load colleges data" }, { status: 500 });
  }
}
