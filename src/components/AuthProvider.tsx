"use client";

import { SessionProvider } from "next-auth/react";
import * as React from "react";

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // The SessionProvider needs to be a Client Component
  return <SessionProvider>{children}</SessionProvider>;
}

