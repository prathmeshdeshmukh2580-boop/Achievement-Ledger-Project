export type YearOfStudy = '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | 'Passed out';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  yearOfStudy: YearOfStudy;
  branch: string;
  state: string;
  district: string;
  city: string;
  college: string;
  customCollege?: string;
  created_at?: string;
  updated_at?: string;
}

export type AchievementCategory =
  | 'Hackathon'
  | 'Competition'
  | 'Course'
  | 'Certification'
  | 'Sports'
  | 'Academic'
  | 'Cultural'
  | 'Other';

export type AchievementType =
  | 'winner'
  | 'runner_up'
  | 'finalist'
  | 'position'
  | 'participation'
  | 'completion'
  | 'other';

export interface Achievement {
  id: string;
  user_id: string;
  achievement_title: string;
  event_name: string;
  issuer: string;
  category: AchievementCategory;
  achievement_type: AchievementType;
  position: string | null;
  date: string;
  recipient_name: string | null;
  credential_id: string | null;
  platform: string | null;
  verification_url: string | null;
  summary: string;
  file_url: string | null;
  file_name: string | null;
  file_type?: string;
  created_at: string;
}

export interface PlatformStats {
  github?: {
    username: string;
    url: string;
    repos: number;
    followers: number;
    last_updated: string;
  } | null;
  leetcode?: {
    username: string;
    url: string;
    totalSolved: number;
    easy: number;
    medium: number;
    hard: number;
    last_updated: string;
  } | null;
  codeforces?: {
    username: string;
    url: string;
    rating: number;
    maxRating: number;
    rank: string;
    solved: number;
    last_updated: string;
  } | null;
  hackerrank?: {
    username: string;
    url: string;
    badges: number;
    stars: number;
    last_updated: string;
  } | null;
  credly?: {
    username: string;
    url: string;
    badgeCount: number;
    last_updated: string;
  } | null;
}

export interface CollegeRecord {
  state: string;
  district: string;
  city: string;
  college_name: string;
}
