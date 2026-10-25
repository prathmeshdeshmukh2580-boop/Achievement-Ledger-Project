import { CollegeRecord } from "@/types";

export function parseCollegesCSV(csvText: string): CollegeRecord[] {
  // Filter out empty lines and comment lines starting with #
  const lines = csvText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"));
  if (lines.length <= 1) return [];
  
  const records: CollegeRecord[] = [];
  // Skip header: state,district,city,college_name
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Handle potential quoted fields
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim());

    if (parts.length >= 4) {
      records.push({
        state: parts[0],
        district: parts[1],
        city: parts[2],
        college_name: parts[3],
      });
    }
  }
  return records;
}

export function getUniqueStates(records: CollegeRecord[]): string[] {
  return Array.from(new Set(records.map(r => r.state))).sort();
}

export function getDistrictsForState(records: CollegeRecord[], state: string): string[] {
  if (!state) return [];
  return Array.from(new Set(records.filter(r => r.state.toLowerCase() === state.toLowerCase()).map(r => r.district))).sort();
}

export function getCitiesForDistrict(records: CollegeRecord[], state: string, district: string): string[] {
  if (!state || !district) return [];
  return Array.from(
    new Set(
      records
        .filter(r => r.state.toLowerCase() === state.toLowerCase() && r.district.toLowerCase() === district.toLowerCase())
        .map(r => r.city)
    )
  ).sort();
}

export function getCollegesForCity(records: CollegeRecord[], state: string, district: string, city: string): string[] {
  if (!state || !district || !city) return [];
  return Array.from(
    new Set(
      records
        .filter(
          r =>
            r.state.toLowerCase() === state.toLowerCase() &&
            r.district.toLowerCase() === district.toLowerCase() &&
            r.city.toLowerCase() === city.toLowerCase()
        )
        .map(r => r.college_name)
    )
  ).sort();
}
