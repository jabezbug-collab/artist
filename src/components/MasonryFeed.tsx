"use client";

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc, deleteDoc, collection, addDoc, query, orderBy, getDocs } from "firebase/firestore";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function PinCard({ pin }: { pin: any }) {
  const [liked, setLiked] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const userData = userDoc.data();

        // 1. Check if pin is liked
        const likedPins = userData?.likedPins || [];
        setLiked(likedPins.includes(pin.id));

        // 2. Check if creator is followed
        const ownerId = pin.ownerId || pin.userId;
        const following = userData?.following || [];
        if (ownerId) {
          setIsFollowing(following.includes(ownerId));
        }
      } catch (e) {
        console.error("Error checking status:", e);
      }
    };
    checkUserStatus();
  }, [pin]);

  useEffect(() => {
    if (showComment) {
      const fetchComments = async () => {
        try {
          const q = query(collection(db, "posts", pin.id, "comments"), orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) {
          console.error("Error fetching comments:", e);
        }
      };
      fetchComments();
    }
  }, [showComment, pin.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      alert("Please sign in to like pins!");
      return;
    }

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          likedPins: [pin.id],
          following: [],
          savedPins: []
        }, { merge: true });
        setLiked(true);
      } else {
        if (liked) {
          await updateDoc(userRef, {
            likedPins: arrayRemove(pin.id)
          });
          setLiked(false);
        } else {
          await updateDoc(userRef, {
            likedPins: arrayUnion(pin.id)
          });
          setLiked(true);
        }
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      alert("Please sign in to save pins!");
      return;
    }

    try {
      const userSavedRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userSavedRef, {
        savedPins: arrayUnion(pin.id)
      }, { merge: true });
      alert("Saved to your collection!");
    } catch (error) {
      console.error("Error saving pin:", error);
      alert("Failed to save pin.");
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      alert("Please sign in to follow users!");
      return;
    }

    const ownerId = pin.ownerId || pin.userId;
    if (!ownerId) {
      alert("Could not find the creator of this pin. Please check if the post has a userId/ownerId in Firestore.");
      return;
    }

    try {
      const myRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(myRef);

      if (!userSnap.exists()) {
        await setDoc(myRef, {
          following: [ownerId],
          likedPins: [],
          savedPins: []
        }, { merge: true });
        setIsFollowing(true);
      } else {
        if (isFollowing) {
          await updateDoc(myRef, {
            following: arrayRemove(ownerId)
          });
          setIsFollowing(false);
        } else {
          await updateDoc(myRef, {
            following: arrayUnion(ownerId)
          });
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (!auth.currentUser) {
      alert("Please sign in to comment!");
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const userData = userDoc.data();

      await addDoc(collection(db, "posts", pin.id, "comments"), {
        text: comment,
        userId: auth.currentUser.uid,
        username: userData?.username || auth.currentUser.displayName || "Anonymous",
        userImage: userData?.photoURL || "",
        createdAt: new Date().toISOString(),
      });

      setComment("");
      setShowComment(false);
    } catch (error) {
      console.error("Comment error:", error);
      alert("Failed to post comment.");
    }
  };

  return (
    <div className="relative group break-inside-avoid mb-4 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl bg-gray-50 dark:bg-zinc-900"
         onClick={() => {
           const ownerId = pin.ownerId || pin.userId;
           if (pin.id) {
             window.location.href = `/post/${pin.id}`;
           }
         }}>
      <div className="relative overflow-hidden">
        <img
          src={pin.imageURL || pin.imageData}
          alt={pin.title}
          className="w-full block transition-transform duration-500 group-hover:scale-105 object-contain"
          style={{ height: 'auto' }}
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="bg-red-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-red-700 transition-colors shadow-lg"
            >
              Save
            </button>
          </div>

          {/* Only show action buttons for medium/large images (where image height > 200px) */}
          {pin.imageData || pin.imageURL ? (
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={handleLike}
                  className="bg-white/90 p-2 rounded-full text-black hover:bg-white transition-all backdrop-blur-sm"
                >
                  <Heart className={cn("w-4 h-4", liked ? "fill-red-500 text-red-500" : "")} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (pin.id) {
                      window.location.href = `/post/${pin.id}`;
                    }
                  }}
                  className="bg-white/90 p-2 rounded-full text-black hover:bg-white transition-all backdrop-blur-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div
                  onClick={() => {
                    const ownerId = pin.ownerId || pin.userId;
                    if (ownerId) {
                      window.location.href = `/profile?id=${ownerId}`;
                    } else {
                      alert("Could not find this user's ID.");
                    }
                  }}
                  className="bg-white/90 px-3 py-1 rounded-full text-xs font-medium text-black backdrop-blur-sm cursor-pointer hover:bg-white transition-colors"
                >
                  {pin.creator || pin.username || "Unknown"}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {showComment && (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 p-3 border-t border-gray-100 dark:border-zinc-700 animate-in slide-in-from-bottom-2 z-20 max-h-64 overflow-y-auto">
          <div className="space-y-3 mb-4">
            {comments.length > 0 ? (
              comments.map((c) => (
                <div key={c.id} className="flex gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0 overflow-hidden">
                    {c.userImage && <img src={c.userImage} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-zinc-100">{c.username}</span>
                    <p className="text-gray-600 dark:text-zinc-400">{c.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 italic">No comments yet. Be the first!</p>
            )}
          </div>
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-xs p-2 bg-gray-100 dark:bg-zinc-700 rounded-lg outline-none text-black dark:text-white"
            />
            <button type="submit" className="text-xs font-bold text-red-600 px-2">Post</button>
          </form>
        </div>
      )}

      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{pin.title || "Untitled"}</p>
      </div>
    </div>
  );
}

export default function MasonryFeed({ pins }: { pins: any[] }) {
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 w-full px-4 md:px-0">
      {pins.map((pin, idx) => (
        <PinCard key={idx} pin={pin} />
      ))}
    </div>
  );
}
