"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  token: string | null;
  userId: string | null;
  mobileNumber: string | null;
  login: (token: string, mobileNumber: string, userId: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");
    const storedMobileNumber = localStorage.getItem("mobileNumber");

    if (storedToken && storedUserId && storedMobileNumber) {
      setToken(storedToken);
      setUserId(storedUserId);
      setMobileNumber(storedMobileNumber);
    }
  }, []);

  const login = (newToken: string, newMobileNumber: string, newUserId: string) => {
    setToken(newToken);
    setUserId(newUserId);
    setMobileNumber(newMobileNumber);
    localStorage.setItem("token", newToken);
    localStorage.setItem("userId", newUserId);
    localStorage.setItem("mobileNumber", newMobileNumber);
    toast({
      title: "Logged In",
      description: `Welcome, ${newMobileNumber}!`,
      variant: "default",
    });
  };

  const logout = () => {
    setToken(null);
    setUserId(null);
    setMobileNumber(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("mobileNumber");
    toast({
      title: "Logged Out",
      description: "You have been logged out.",
      variant: "default",
    });
  };

  const isAuthenticated = !!token && !!userId && !!mobileNumber;

  return (
    <AuthContext.Provider value={{ token, userId, mobileNumber, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 