"use client";

import React, { useState } from 'react';
import { Upload, Image as ImageIcon } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Sidebar from "@/components/Sidebar";

export default function CreatePinPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success'>('idle');

  // Function to compress image using a Canvas
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Set maximum dimensions to keep file size low
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      try {
        const compressed = await compressImage(selectedFile);
        setPreview(compressed);
      } catch (error) {
        console.error("Compression error:", error);
        alert("Failed to process image.");
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview || !auth.currentUser) {
      alert("Please sign in and select an image");
      return;
    }

    setStatus('uploading');
    try {
      await addDoc(collection(db, "posts"), {
        title,
        description,
        imageData: preview,
        userId: auth.currentUser.uid,
        ownerId: auth.currentUser.uid,
        username: auth.currentUser.displayName || "Anonymous",
        createdAt: serverTimestamp(),
        visibility: "public",
      });

      setStatus('success');
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      console.error("Firestore upload error:", error);
      alert("The compressed image is still too large for the database. Please try a different photo.");
      setStatus('idle');
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-8 rounded-3xl shadow-sm transition-colors">
          <h1 className="text-2xl font-bold mb-8">Create New Pin</h1>

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer relative overflow-hidden">
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <ImageIcon className="w-12 h-12" />
                  <p>Click to upload image</p>
                </div>
              )}
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept="image/*"
              />
            </div >

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Add your title"
                className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 text-black dark:text-white"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <textarea
                placeholder="Tell everyone what your pin is about"
                className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 h-32 resize-none text-black dark:text-white"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div >

            <button
              type="submit"
              disabled={status !== 'idle'}
              className="w-full py-4 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors disabled:bg-gray-400"
            >
              {status === 'uploading' ? "Compressing & Saving..." : status === 'success' ? "Saved! Redirecting..." : "Publish Pin"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
