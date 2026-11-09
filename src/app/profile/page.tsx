"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import { User, Camera } from "lucide-react";
import { db, storage, auth } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import MasonryFeed from "@/components/MasonryFeed";

function ProfileContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      let targetUserId = userId;

      if (!targetUserId && auth.currentUser) {
        targetUserId = auth.currentUser.uid;
      }

      if (!targetUserId) {
        setLoading(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", targetUserId));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }

        // BASED ON YOUR DATABASE LOG: The field is exactly "userId"
        const q = query(
          collection(db, "posts"),
          where("userId", "==", targetUserId),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);
        const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserPosts(posts);
      } catch (e) {
        console.error("Error loading profile:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="relative inline-block group">
        <div className="w-32 h-32 bg-zinc-800 rounded-full mx-auto mb-4 overflow-hidden border-4 border-zinc-700 shadow-lg flex items-center justify-center">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-full h-full p-6 text-zinc-500" />
          )}
        </div>
        <label className="absolute bottom-2 right-2 bg-red-600 p-2 rounded-full cursor-pointer hover:bg-red-700 transition-all shadow-lg text-white">
          <Camera className="w-4 h-4" />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={async (e) => {
              if (!e.target.files?.[0]) return;
              const file = e.target.files[0];

              try {
                const currentUserId = userId || auth.currentUser?.uid;
                if (!currentUserId) {
                  alert("Please sign in to upload a photo.");
                  return;
                }

                const storageRef = ref(storage, `profiles/${currentUserId}/${file.name}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);

                await updateDoc(doc(db, "users", currentUserId), {
                  photoURL: url
                });
                setProfile(prev => ({ ...prev, photoURL: url }));
                alert("Profile picture updated!");
              } catch (err) {
                console.error(err);
                alert("Failed to upload image.");
              }
            }}
          />
        </label>
      </div>

      {!userId ? (
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{profile?.displayName || "Your Profile"}</h1>
          <p className="text-zinc-400">{profile?.bio || "Welcome back!"}</p>
        </div>
      ) : (
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{profile?.displayName || "User Profile"}</h1>
          <p className="text-zinc-400">{profile?.bio || "Visual Designer & Curator"}</p>
        </div>
      )}

      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-6 text-left px-2">Posts</h2>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-zinc-900 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : userPosts.length > 0 ? (
          <MasonryFeed pins={userPosts} />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-zinc-900 rounded-3xl border border-zinc-800">
            <Camera className="w-12 h-12 text-zinc-700 mb-2" />
            <p className="text-zinc-500">No posts found for this user.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50 transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto p-8">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-500"></div>
          </div>
        }>
          <ProfileContent />
        </Suspense>
      </main>
    </div>
  );
}
