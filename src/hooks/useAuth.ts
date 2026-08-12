"use client";

import { useCallback, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
}

/**
 * Client-side Firebase Auth state helper for admin UI.
 * Session cookie is still the source of truth for server routes.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAdmin: false,
  });

  useEffect(() => {
    const auth = getClientAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({
          user: null,
          loading: false,
          error: null,
          isAdmin: false,
        });
        return;
      }

      try {
        const tokenResult = await user.getIdTokenResult();
        setState({
          user,
          loading: false,
          error: null,
          isAdmin: tokenResult.claims.admin === true,
        });
      } catch (error) {
        setState({
          user,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to read auth claims",
          isAdmin: false,
        });
      }
    });

    return () => unsub();
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await firebaseSignOut(getClientAuth());
  }, []);

  const getIdToken = useCallback(async (forceRefresh = false) => {
    const user = getClientAuth().currentUser;
    if (!user) return null;
    return user.getIdToken(forceRefresh);
  }, []);

  return {
    ...state,
    logout,
    getIdToken,
  };
}
