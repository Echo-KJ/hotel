import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Custom hook to use authentication
 * Automatically initializes auth state on first use
 */
export function useAuth() {
  const { user, loading, initialized, initialize, signIn, signUp, signOut } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };
}
