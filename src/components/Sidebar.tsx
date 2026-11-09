"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Home, Compass, Search, PlusSquare, Bookmark, User, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function SidebarItem({ icon: Icon, label, href, active = false }: { icon: any, label: string, href: string, active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group",
        active
          ? "bg-zinc-800 text-zinc-50 font-semibold"
          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "text-zinc-50" : "text-zinc-500 group-hover:text-zinc-100")} />
      <span className="text-sm">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 p-4 border-r border-zinc-800 bg-zinc-950">
      <div className="px-4 py-6 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Artist<span className="text-red-600">.</span></h1>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        <SidebarItem icon={Home} label="Home" href="/" active={pathname === "/"} />
        <SidebarItem icon={Compass} label="Explore" href="/explore" active={pathname === "/explore"} />
        <SidebarItem icon={PlusSquare} label="Create Pin" href="/create" active={pathname === "/create"} />
        <SidebarItem icon={Bookmark} label="Saved" href="/saved" active={pathname === "/saved"} />
        <SidebarItem icon={User} label="Profile" href="/profile" active={pathname === "/profile"} />
        <SidebarItem icon={Settings} label="Settings" href="/settings" active={pathname === "/settings"} />
      </nav>

      <div className="mt-auto pt-4 border-t border-zinc-800">
        {!user ? (
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 rounded-full text-sm font-medium hover:bg-white transition-colors"
          >
            Sign in with Google
          </button>
        ) : (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <img src={user.photoURL || ""} className="w-8 h-8 rounded-full" alt="User" />
              <span className="text-xs font-medium truncate max-w-[100px] text-zinc-50">{user.displayName}</span>
            </div>
            <button onClick={handleSignOut} className="text-zinc-500 hover:text-red-600 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
