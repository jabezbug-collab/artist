"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import MasonryFeed from "@/components/MasonryFeed";
import Sidebar from "@/components/Sidebar";
import { FolderHeart, Loader2 } from "lucide-react";

function SavedContent() {
  const [savedPins, setSavedPins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedPins = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        // 1. Get the user's savedPins array
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const savedIds = userDoc.data()?.savedPins || [];

        if (savedIds.length === 0) {
          setSavedPins([]);
          setLoading(false);
          return;
        }

        // 2. Fetch the actual post documents for those IDs
        // Firestore doesn't have a "WHERE IN" for more than 10-30 IDs easily in a single query,
        // so we'll fetch and filter or use chunks. For a reasonable amount, we fetch all and filter.
        const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const postsSnap = await getDocs(postsQuery);

        const allPins = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filteredPins = allPins.filter(pin => savedIds.includes(pin.id));

        setSavedPins(filteredPins);
      } catch (error) {
        console.error("Error fetching saved pins:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedPins();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <FolderHeart className="w-8 h-8 text-red-500" />
        <h1 className="text-3xl font-bold text-zinc-50">Your Saved Pins</h1>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-10 h-10 text-zinc-600 animate-spin mb-4" />
          <p className="text-zinc-500">Loading your collection...</p>
        </div>
      ) : savedPins.length > 0 ? (
        <MasonryFeed pins={savedPins} />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-zinc-900 rounded-3xl border border-zinc-800 text-center p-6">
          <FolderHeart className="w-12 h-12 text-zinc-700 mb-4" />
          <p className="text-zinc-500 text-lg">You haven't saved any pins yet.</p>
          <p className="text-zinc-600 text-sm mt-2">Explore the feed and save things you love!</p>
        </div>
      )}
    </div>
  );
}

export default function SavedPage() {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50 transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto p-8">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-12 h-12 animate-spin text-zinc-500" /></div>}>
          <SavedContent />
        </Suspense>
      </main>
    </div>
  );
}
