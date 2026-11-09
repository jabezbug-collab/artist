"use client";

import React, { useState, useEffect, use, Suspense } from 'react';
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, deleteDoc, setDoc } from "firebase/firestore";
import { Heart, MessageCircle, ArrowLeft, Trash2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function PostContent({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const postId = params.id;
        const postDoc = await getDoc(doc(db, "posts", postId));

        if (postDoc.exists()) {
          setPost({ id: postDoc.id, ...postDoc.data() });
          if (auth.currentUser) {
            const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
            const userData = userDoc.data();
            setLiked((userData?.likedPins || []).includes(postDoc.id));
          }
        }

        const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error("Error fetching post:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPostData();
  }, [params.id]);

  const handleLike = async () => {
    if (!auth.currentUser) return alert("Please sign in to like!");
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const currentLiked = userSnap.exists() ? (userSnap.data()?.likedPins || []) : [];
      const updatedLiked = liked ? currentLiked.filter((id: string) => id !== post?.id) : [...currentLiked, post?.id];
      await setDoc(userRef, { likedPins: updatedLiked }, { merge: true });
      setLiked(!liked);
    } catch (e) { console.error("Like error:", e); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !auth.currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const userData = userDoc.data();
      await addDoc(collection(db, "posts", post.id, "comments"), {
        text: newComment,
        userId: auth.currentUser.uid,
        username: userData?.username || auth.currentUser.displayName || "Anonymous",
        userImage: userData?.photoURL || "",
        createdAt: new Date().toISOString(),
      });
      setNewComment("");
      const q = query(collection(db, "posts", post.id, "comments"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error("Comment error:", e); }
  };

  const handleDelete = async () => {
    if (!auth.currentUser || (auth.currentUser.uid !== post?.ownerId && auth.currentUser.uid !== post?.userId)) {
      return alert("You can only delete your own posts!");
    }
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteDoc(doc(db, "posts", post.id));
      window.location.href = "/";
    } catch (e) { alert("Failed to delete post."); }
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4">
    <div className="w-10 h-10 border-4 border-zinc-700 border-t-red-600 rounded-full animate-spin"></div>
    <p>Loading your post...</p>
  </div>;
  if (!post) return <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4">
    <h1 className="text-2xl font-bold">Post not found.</h1>
    <p className="text-zinc-500">The post may have been deleted or the ID is incorrect.</p>
    <Link href="/" className="mt-4 bg-zinc-800 hover:bg-zinc-700 px-6 py-2 rounded-full transition-colors">
      Return Home
    </Link>
  </div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors w-fit">
          <ArrowLeft className="w-5 h-5" />
          Back to feed
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 relative rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl">
            <img src={post.imageURL || post.imageData} alt={post.title} className="w-full h-auto object-contain" />
            {auth.currentUser?.uid === post.ownerId || auth.currentUser?.uid === post.userId ? (
              <button
                onClick={handleDelete}
                className="absolute top-4 right-4 p-3 bg-red-600/80 hover:bg-red-600 text-white rounded-full transition-all backdrop-blur-md shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            ) : null}
          </div>
          <div className="lg:col-span-5 flex flex-col h-full sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700 flex items-center justify-center text-white font-bold text-lg">
                   {post.userImage ? (
                     <img src={post.userImage} alt="" className="w-full h-full object-cover" />
                   ) : (
                     (post.creator || post.username || "U").charAt(0).toUpperCase()
                   )}
                </div>
                <div>
                  <h1 className="text-xl font-bold">{post.creator || post.username || "Unknown"}</h1>
                  <p className="text-zinc-500 text-xs">Posted on {new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold text-sm transition-all">Save</button>
            </div>
            <h2 className="text-3xl font-bold mb-4">{post.title || "Untitled"}</h2>
            <p className="text-zinc-400 text-lg mb-8 leading-relaxed">{post.description || "No description provided."}</p>
            <div className="flex items-center gap-6 mb-8">
              <button onClick={handleLike} className={cn("flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all shadow-lg", liked ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700")}>
                <Heart className={cn("w-5 h-5", liked && "fill-current")} />
                {liked ? "Liked" : "Like"}
              </button>
              <div className="flex items-center gap-2 text-zinc-500 font-medium"><MessageCircle className="w-5 h-5" /> {comments.length} Comments</div>
            </div>
            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 flex-1">
              <h3 className="text-xl font-bold mb-6">Comments</h3>
              <div className="space-y-6 mb-8 max-h-[50vh] overflow-y-auto pr-2">
                {comments.length > 0 ? comments.map((c) => (
                  <div key={c.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold text-xs border border-zinc-700">
                      {c.userImage ? (
                        <img src={c.userImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (c.username || "U").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1"><p className="font-bold text-sm">{c.username}</p><p className="text-zinc-400 text-sm">{c.text}</p></div>
                  </div>
                )) : <p className="text-zinc-500 italic text-sm">No comments yet. Be the first!</p>}
              </div>
              <form onSubmit={handleComment} className="flex gap-3">
                <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-6 py-3 text-sm outline-none focus:ring-2 focus:ring-red-600 transition-all" />
                <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-sm font-bold transition-all">Post</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Loading...</div>}>
      <PostParamsWrapper paramsPromise={paramsPromise} />
    </Suspense>
  );
}

function PostParamsWrapper({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  return <PostContent params={params} />;
}
