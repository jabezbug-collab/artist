"use client";

import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from "next-themes";

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      {children}
    </ThemeProvider>
  );
}
