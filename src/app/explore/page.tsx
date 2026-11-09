"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import MasonryFeed from "@/components/MasonryFeed";
import Sidebar from "@/components/Sidebar";
import { Search } from "lucide-react";

export default function ExplorePage() {
  const [pins, setPins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPins = async () => {
      try {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const pinsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            imageURL: data.imageURL || data.imageData || "https://via.placeholder.com/500x700?text=No+Image",
            title: data.title || "Untitled Pin",
            creator: data.username || data.creator || "Anonymous",
            description: data.description || "",
          };
        });
        setPins(pinsData);
      } catch (error) {
        console.error("Error fetching pins: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPins();
  }, []);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto bg-zinc-950 text-zinc-50">
        <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-3xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Explore new ideas..."
              className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-sm text-zinc-50 focus:ring-2 focus:ring-zinc-700 transition-all outline-none placeholder:text-zinc-500"
            />
          </div>
        </header>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-zinc-50">Trending Now</h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-zinc-900 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <MasonryFeed pins={pins} />
          )}
        </div>
      </main>
    </div>
  );
}
