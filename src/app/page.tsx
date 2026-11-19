"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import MasonryFeed from "@/components/MasonryFeed";
import Sidebar from "@/components/Sidebar";
import { Search } from "lucide-react";

type Pin = {
  id: string;
  title?: string;
  description?: string;
  creator?: string;
  username?: string;
  // allow any other fields your posts have (imageUrl, createdAt, etc.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export default function Home() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPins = async () => {
      setLoading(true);
      try {
        // Fetch all posts to show on the home feed
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        let pinsData: Pin[] = querySnapshot.docs.map(doc => ({
          ...(doc.data() as Omit<Pin, "id">),
          id: doc.id,
        }));

        // Apply search filter client-side
        if (searchQuery.trim()) {
          const queryLower = searchQuery.toLowerCase();
          pinsData = pinsData.filter(pin =>
            (pin.title?.toLowerCase().includes(queryLower)) ||
            (pin.description?.toLowerCase().includes(queryLower)) ||
            (pin.creator?.toLowerCase().includes(queryLower)) ||
            (pin.username?.toLowerCase().includes(queryLower))
          );
        }

        setPins(pinsData);
      } catch (error) {
        console.error("Error fetching pins: ", error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchPins();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto bg-zinc-950 text-zinc-50">
        <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-3xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search for pins, users, or ideas..."
              className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-sm text-zinc-50 focus:ring-2 focus:ring-zinc-700 transition-all outline-none placeholder:text-zinc-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <div className="p-6">
          {searchQuery && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Search results for &quot;{searchQuery}&quot;</h2>
              <p className="text-sm text-zinc-500">{pins.length} results found</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-zinc-900 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : pins.length > 0 ? (
            <MasonryFeed pins={pins} />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Search className="w-12 h-12 text-zinc-800 mb-4" />
              <p className="text-zinc-500">No results found for &quot;{searchQuery}&quot;</p>
              <p className="text-sm text-zinc-600">Try different keywords or a different user</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}