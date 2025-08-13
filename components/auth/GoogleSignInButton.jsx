"use client";

import { useState } from "react";
import { auth } from "@/lib/firebaseClient";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";

async function postLoginSideEffects(next) {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    await fetch("/api/profile/ensure", { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    await fetch("/api/session/sync",  { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    window.location.assign(next || "/");
  } catch {
    window.location.assign(next || "/");
  }
}

export default function GoogleSignInButton({ next = "/" }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      await postLoginSideEffects(next);
    } catch (e) {
      const code = e?.code || "";
      if (
        code === "auth/unauthorized-domain" ||
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user"
      ) {
        await signInWithRedirect(auth, provider);
        return; // redirect flow will finish on return
      }
      console.error("Google sign-in failed:", e);
      alert(`Google sign-in failed: ${code || "unknown error"}`);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full rounded-md border px-4 py-2 font-medium hover:bg-gray-50"
      disabled={loading}
    >
      {loading ? "Connecting…" : "Continue with Google"}
    </button>
  );
}