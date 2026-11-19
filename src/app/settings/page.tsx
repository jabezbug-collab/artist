"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from "next-themes";
import Sidebar from "@/components/Sidebar";
import { Settings, User, Bell, Lock, Moon, Sun, Mail, ShieldCheck, Globe } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type UserData = {
  displayName?: string;
  bio?: string;
  photoURL?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (docSnap.exists()) setUserData(docSnap.data() as UserData);
      }
    };
    fetchUserData();
  }, []);

  const updateProfile = async (field: string, value: string) => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { [field]: value });
      setUserData((prev: UserData | null) => ({ ...(prev ?? {}), [field]: value }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Account Settings</h1>
          </div>

          <div className="space-y-6">
            <section className="p-6 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 transition-colors">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Profile Information
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-500 dark:text-zinc-400 uppercase font-semibold">Display Name</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userData?.displayName || ""}
                      onChange={(e) => updateProfile("displayName", e.target.value)}
                      className="flex-1 p-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-500 dark:text-zinc-400 uppercase font-semibold">Email</span>
                  <span className="text-sm">{auth.currentUser?.email}</span>
                </div>
              </div>
            </section>

            <section className="p-6 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 transition-colors">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Security &amp; Privacy
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Make Profile Private</span>
                  <input type="checkbox" className="accent-red-600" />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Two-Factor Authentication</span>
                  <span className="text-xs bg-gray-200 dark:bg-zinc-700 px-2 py-1 rounded">Off</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}