import React, { useState } from "react";
import { useAuth } from "../auth/AuthProvider";

export default function AuthButton() {
  const { user, signInWithGoogle, signOut, loading } = useAuth();
  const [authError, setAuthError] = useState("");

  const handleSignIn = async () => {
    setAuthError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      if (err.code === "auth/operation-not-allowed") {
        setAuthError(
          "Google Sign-In is disabled. You must enable the Google provider in your Firebase Console under Authentication > Sign-in method."
        );
      } else if (err.code === "auth/popup-closed-by-user") {
        setAuthError("Sign-in popup was closed before completing.");
      } else {
        setAuthError(err.message || "Failed to sign in.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm border border-slate-700 animate-pulse">
        <div className="w-5 h-5 bg-slate-700 rounded-full"></div>
        <div className="w-16 h-4 bg-slate-700 rounded"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-3 bg-slate-800/80 hover:bg-slate-850 p-1.5 pr-3 rounded-full border border-slate-700 transition-colors">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "User"}
            className="w-8 h-8 rounded-full border border-slate-600 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
          </div>
        )}
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
            {user.displayName || "User"}
          </span>
          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
            {user.email}
          </span>
        </div>
        <button
          onClick={signOut}
          className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors px-2 py-1 hover:bg-slate-700/50 rounded-md"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center">
      <button
        onClick={handleSignIn}
        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md shadow-blue-600/20 active:scale-95 transition-all border border-blue-500"
      >
        <svg
          className="w-4 h-4 fill-current"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.12 1 1.16 5.94 1.16 12s4.96 11 11.08 11c6.39 0 10.63-4.49 10.63-10.82 0-.73-.08-1.285-.177-1.895H12.24Z" />
        </svg>
        <span>Sign In with Google</span>
      </button>
      {authError && (
        <div className="absolute top-full mt-2 w-64 bg-red-950/95 border border-red-800 text-red-300 text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center font-medium leading-normal animate-in fade-in slide-in-from-top-1 duration-200">
          <span>{authError}</span>
          <button
            onClick={() => setAuthError("")}
            className="block mx-auto mt-1 text-[9px] underline text-red-400 hover:text-red-200"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
