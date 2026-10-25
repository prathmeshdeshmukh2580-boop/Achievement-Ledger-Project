"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Award, User, LogOut, FileText, BarChart2, Info, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/extract", label: "Extract Certificate", icon: Award },
    { href: "/platforms", label: "Platform Stats", icon: BarChart2 },
    { href: "/resume", label: "Resume", icon: FileText },
    { href: "/about", label: "About", icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-sm border-b border-cream-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-md bg-navy-800 text-cream-50 flex items-center justify-center font-serif text-lg font-bold shadow-sm transition group-hover:bg-navy-700">
                A
              </div>
              <div>
                <span className="font-serif text-xl font-bold tracking-tight text-navy-900 group-hover:text-navy-700 transition">
                  Achievement Hub
                </span>
                <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-cream-200 text-navy-800 rounded">
                  DT Project
                </span>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    isActive
                      ? "bg-navy-800 text-cream-50"
                      : "text-navy-800 hover:text-navy-900 hover:bg-cream-100"
                  }`}
                >
                  <Icon className="w-4 h-4 opacity-80" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Profile / Auth */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-md text-sm text-navy-900 hover:bg-cream-100 transition"
                  title="Edit Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-cream-200 flex items-center justify-center text-navy-800 font-medium text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="hidden lg:block text-left text-xs leading-tight">
                    <p className="font-medium text-navy-900 truncate max-w-[120px]">
                      {user.fullName}
                    </p>
                    <p className="text-gray-500 text-[10px]">{user.branch}</p>
                  </div>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-md text-navy-700 hover:text-red-700 hover:bg-cream-100 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-md text-sm font-medium text-navy-800 hover:bg-cream-100 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-3.5 py-1.5 rounded-md text-sm font-medium bg-navy-800 text-cream-50 hover:bg-navy-700 shadow-sm transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 space-x-2 border-t border-cream-border bg-[#FAF8F5]">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-1 whitespace-nowrap px-2.5 py-1 rounded text-xs font-medium transition ${
                isActive
                  ? "bg-navy-800 text-cream-50"
                  : "text-navy-800 hover:bg-cream-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
