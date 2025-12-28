"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  LayoutDashboard,
  Bot,
  Rocket,
  BarChart3,
  Users,
  DollarSign,
  Boxes,
  GraduationCap,
  Menu,
  X,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI Assistants", href: "/assistants", icon: Bot },
  { name: "AI Initiatives", href: "/initiatives", icon: Rocket },
  { name: "Usage Metrics", href: "/metrics", icon: BarChart3 },
  { name: "Team Maturity", href: "/maturity", icon: Users },
  { name: "AI Culture", href: "/culture", icon: Trophy },
  { name: "Value Tracking", href: "/value", icon: DollarSign },
  { name: "Blueprints", href: "/blueprints", icon: Boxes },
  { name: "Learning", href: "/learning", icon: GraduationCap },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-40 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="relative w-60 h-55 border-b border-gray-800">
            <Image 
              src="/logo.png" 
              alt="AI-OS Logo" 
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              © 2025 AI-OS Platform
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
