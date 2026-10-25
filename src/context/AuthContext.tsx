"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile, Achievement, PlatformStats } from "@/types";
import { supabase, isSupabaseConfigured, isDevMockEnabled } from "@/lib/supabase";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  achievements: Achievement[];
  platformStats: PlatformStats;
  isSupabaseConnected: boolean;
  signUp: (email: string, pass: string, profile: Omit<UserProfile, "id" | "email">) => Promise<{ error?: string }>;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => Promise<{ error?: string }>;
  addAchievement: (achievement: Omit<Achievement, "id" | "user_id" | "created_at">) => Promise<{ error?: string; achievement?: Achievement }>;
  deleteAchievement: (id: string) => Promise<{ error?: string }>;
  updatePlatformStats: (stats: PlatformStats) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USERS_KEY = "achievement_hub_users";
const LOCAL_STORAGE_SESSION_KEY = "achievement_hub_session";
const LOCAL_STORAGE_ACHIEVEMENTS_KEY = "achievement_hub_achievements";
const LOCAL_STORAGE_PLATFORMS_KEY = "achievement_hub_platforms";

function normalizeProfile(row: any): UserProfile {
  return {
    id: row.id || row.user_id,
    email: row.email,
    fullName: row.fullName || row.full_name || "",
    yearOfStudy: row.yearOfStudy || row.year_of_study || "1st Year",
    branch: row.branch || "",
    state: row.state || "",
    district: row.district || "",
    city: row.city || "",
    college: row.college || "",
    customCollege: row.customCollege || row.custom_college || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({});

  // Initialize session and data
  useEffect(() => {
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle();

            if (profile) {
              setUser(normalizeProfile(profile));
              await fetchSupabaseUserData(session.user.id);
            }
          }

          const client = supabase;
          const { data: listener } = client.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_OUT") {
              setUser(null);
              setAchievements([]);
              setPlatformStats({});
            } else if (session?.user && event === "SIGNED_IN") {
              const { data: profile } = await client
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .maybeSingle();

              if (profile) {
                setUser(normalizeProfile(profile));
                await fetchSupabaseUserData(session.user.id);
              }
            }
          });
          authListener = listener;
        } else if (isDevMockEnabled) {
          const sessionEmail = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
          if (sessionEmail) {
            const usersJson = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
            const users: Record<string, { profile: UserProfile; pass: string }> = usersJson ? JSON.parse(usersJson) : {};
            if (users[sessionEmail]) {
              setUser(users[sessionEmail].profile);
              loadLocalUserData(users[sessionEmail].profile.id);
            }
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  function loadLocalUserData(userId: string) {
    try {
      const achsJson = localStorage.getItem(LOCAL_STORAGE_ACHIEVEMENTS_KEY);
      if (achsJson) {
        const allAchs: Achievement[] = JSON.parse(achsJson);
        setAchievements(allAchs.filter(a => a.user_id === userId));
      } else {
        setAchievements([]);
      }

      const platJson = localStorage.getItem(LOCAL_STORAGE_PLATFORMS_KEY);
      if (platJson) {
        const allPlats: Record<string, PlatformStats> = JSON.parse(platJson);
        setPlatformStats(allPlats[userId] || {});
      } else {
        setPlatformStats({});
      }
    } catch (e) {
      console.error("Error loading local user data:", e);
    }
  }

  async function fetchSupabaseUserData(userId: string) {
    if (!supabase) return;
    try {
      const { data: achData } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (achData) setAchievements(achData as Achievement[]);

      const { data: platData } = await supabase
        .from("platform_stats")
        .select("stats")
        .eq("user_id", userId)
        .maybeSingle();

      if (platData?.stats) setPlatformStats(platData.stats);
    } catch (e) {
      console.error("Error fetching Supabase data:", e);
    }
  }

  const signUp = async (
    email: string,
    pass: string,
    profileData: Omit<UserProfile, "id" | "email">
  ) => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail || !pass) return { error: "Email and password are required" };

      if (isSupabaseConfigured && supabase) {
        // Pass metadata to trigger automatic profile creation via Postgres trigger
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: pass,
          options: {
            data: {
              fullName: profileData.fullName,
              full_name: profileData.fullName,
              yearOfStudy: profileData.yearOfStudy,
              year_of_study: profileData.yearOfStudy,
              branch: profileData.branch,
              state: profileData.state,
              district: profileData.district,
              city: profileData.city,
              college: profileData.college,
              customCollege: profileData.customCollege,
              custom_college: profileData.customCollege,
            },
          },
        });
        if (error) return { error: error.message };
        if (!data.user) return { error: "Signup failed" };

        const fullProfile: UserProfile = {
          id: data.user.id,
          email: trimmedEmail,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Code path fallback / explicit upsert to profiles table
        const { error: pError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          user_id: data.user.id,
          email: trimmedEmail,
          fullName: profileData.fullName,
          full_name: profileData.fullName,
          yearOfStudy: profileData.yearOfStudy,
          year_of_study: profileData.yearOfStudy,
          branch: profileData.branch,
          state: profileData.state,
          district: profileData.district,
          city: profileData.city,
          college: profileData.college,
          customCollege: profileData.customCollege,
          custom_college: profileData.customCollege,
          created_at: fullProfile.created_at,
          updated_at: fullProfile.updated_at,
        });
        if (pError) {
          console.warn("Direct profile upsert:", pError.message);
        }

        setUser(fullProfile);
        setAchievements([]);
        setPlatformStats({});
        return {};
      } else if (isDevMockEnabled) {
        const usersJson = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
        const users: Record<string, { profile: UserProfile; pass: string }> = usersJson ? JSON.parse(usersJson) : {};

        if (users[trimmedEmail]) {
          return { error: "An account with this email already exists." };
        }

        const newId = "usr_" + Math.random().toString(36).substring(2, 11);
        const fullProfile: UserProfile = {
          id: newId,
          email: trimmedEmail,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        users[trimmedEmail] = { profile: fullProfile, pass };
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, trimmedEmail);

        setUser(fullProfile);
        setAchievements([]);
        setPlatformStats({});
        return {};
      } else {
        return {
          error:
            "Supabase credentials missing. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
        };
      }
    } catch (err: any) {
      return { error: err.message || "Failed to sign up" };
    }
  };

  const signIn = async (email: string, pass: string) => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: pass,
        });

        if (error) {
          // Check if this was an existing account from the previous local dev mock
          if (typeof window !== "undefined") {
            try {
              const usersJson = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
              const users = usersJson ? JSON.parse(usersJson) : {};
              const localRec = users[trimmedEmail];
              if (localRec && localRec.pass === pass) {
                // Auto-create the user in Supabase so they don't lose their local account
                const regRes = await signUp(trimmedEmail, pass, {
                  fullName: localRec.profile?.fullName || "User",
                  yearOfStudy: localRec.profile?.yearOfStudy || "1st Year",
                  branch: localRec.profile?.branch || "Engineering",
                  state: localRec.profile?.state || "",
                  district: localRec.profile?.district || "",
                  city: localRec.profile?.city || "",
                  college: localRec.profile?.college || "",
                  customCollege: localRec.profile?.customCollege,
                });
                if (!regRes.error) {
                  return {};
                }
              }
            } catch (ignore) {}
          }

          if (error.message.toLowerCase().includes("email not confirmed")) {
            return {
              error:
                "Email confirmation is enabled in your Supabase project. To allow login without email verification, go to Supabase Dashboard -> Authentication -> Providers -> Email, turn OFF 'Confirm email', and click Save.",
            };
          }

          if (error.message.toLowerCase().includes("invalid login credentials")) {
            return {
              error:
                "Invalid login credentials. If you haven't created this account in your new Supabase backend yet, please click 'Sign Up' below to create it.",
            };
          }

          return { error: error.message };
        }
        if (!data.user) return { error: "Login failed" };

        const { data: profile, error: pError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

        if (pError || !profile) {
          // If profile table doesn't have it yet, build fallback profile from user auth
          const fallbackProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email || trimmedEmail,
            fullName: data.user.user_metadata?.fullName || data.user.user_metadata?.full_name || "User",
            yearOfStudy: data.user.user_metadata?.yearOfStudy || data.user.user_metadata?.year_of_study || "1st Year",
            branch: data.user.user_metadata?.branch || "Engineering",
            state: data.user.user_metadata?.state || "",
            district: data.user.user_metadata?.district || "",
            city: data.user.user_metadata?.city || "",
            college: data.user.user_metadata?.college || "",
            created_at: data.user.created_at,
          };
          setUser(fallbackProfile);
        } else {
          setUser(normalizeProfile(profile));
        }

        await fetchSupabaseUserData(data.user.id);
        return {};
      } else if (isDevMockEnabled) {
        const usersJson = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
        const users: Record<string, { profile: UserProfile; pass: string }> = usersJson ? JSON.parse(usersJson) : {};

        const record = users[trimmedEmail];
        if (!record || record.pass !== pass) {
          return { error: "Invalid email or password." };
        }

        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, trimmedEmail);
        setUser(record.profile);
        loadLocalUserData(record.profile.id);
        return {};
      } else {
        return {
          error:
            "Supabase credentials missing. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
        };
      }
    } catch (err: any) {
      return { error: err.message || "Failed to sign in" };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    setUser(null);
    setAchievements([]);
    setPlatformStats({});
  };

  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (!user) return { error: "Not authenticated" };
    try {
      const merged: UserProfile = {
        ...user,
        ...updated,
        updated_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from("profiles")
          .update({
            fullName: merged.fullName,
            full_name: merged.fullName,
            yearOfStudy: merged.yearOfStudy,
            year_of_study: merged.yearOfStudy,
            branch: merged.branch,
            state: merged.state,
            district: merged.district,
            city: merged.city,
            college: merged.college,
            customCollege: merged.customCollege,
            custom_college: merged.customCollege,
            updated_at: merged.updated_at,
          })
          .eq("id", user.id);

        if (error) return { error: error.message };
      } else {
        const usersJson = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
        const users = usersJson ? JSON.parse(usersJson) : {};
        if (users[user.email]) {
          users[user.email].profile = merged;
          localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
        }
      }

      setUser(merged);
      return {};
    } catch (err: any) {
      return { error: err.message || "Failed to update profile" };
    }
  };

  const addAchievement = async (data: Omit<Achievement, "id" | "user_id" | "created_at">) => {
    if (!user) return { error: "Please log in to save achievements" };
    try {
      const newAch: Achievement = {
        ...data,
        id: "ach_" + Math.random().toString(36).substring(2, 11),
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from("achievements").insert(newAch);
        if (error) return { error: error.message };
      } else {
        const achsJson = localStorage.getItem(LOCAL_STORAGE_ACHIEVEMENTS_KEY);
        const allAchs: Achievement[] = achsJson ? JSON.parse(achsJson) : [];
        allAchs.unshift(newAch);
        localStorage.setItem(LOCAL_STORAGE_ACHIEVEMENTS_KEY, JSON.stringify(allAchs));
      }

      setAchievements(prev => [newAch, ...prev]);
      return { achievement: newAch };
    } catch (e: any) {
      return { error: e.message || "Failed to add achievement" };
    }
  };

  const deleteAchievement = async (id: string) => {
    if (!user) return { error: "Not authenticated" };
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from("achievements").delete().eq("id", id).eq("user_id", user.id);
        if (error) return { error: error.message };
      } else {
        const achsJson = localStorage.getItem(LOCAL_STORAGE_ACHIEVEMENTS_KEY);
        if (achsJson) {
          const allAchs: Achievement[] = JSON.parse(achsJson);
          const filtered = allAchs.filter(a => !(a.id === id && a.user_id === user.id));
          localStorage.setItem(LOCAL_STORAGE_ACHIEVEMENTS_KEY, JSON.stringify(filtered));
        }
      }

      setAchievements(prev => prev.filter(a => a.id !== id));
      return {};
    } catch (e: any) {
      return { error: e.message || "Failed to delete" };
    }
  };

  const updatePlatformStats = async (stats: PlatformStats) => {
    if (!user) return { error: "Not authenticated" };
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from("platform_stats").upsert({
          user_id: user.id,
          stats,
          updated_at: new Date().toISOString(),
        });
      } else {
        const platJson = localStorage.getItem(LOCAL_STORAGE_PLATFORMS_KEY);
        const allPlats = platJson ? JSON.parse(platJson) : {};
        allPlats[user.id] = stats;
        localStorage.setItem(LOCAL_STORAGE_PLATFORMS_KEY, JSON.stringify(allPlats));
      }

      setPlatformStats(stats);
      return {};
    } catch (e: any) {
      return { error: e.message || "Failed to update platform stats" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        achievements,
        platformStats,
        isSupabaseConnected: isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        updateProfile,
        addAchievement,
        deleteAchievement,
        updatePlatformStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
