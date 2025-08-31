"use client"

import * as React from "react"

type ToastVariant = "default" | "destructive"

interface Toast {
  title?: string
  description?: string
  variant?: ToastVariant
}

export function useToast() {
  const toast = ({ title, description, variant = "default" }: Toast) => {
    // Simple alert implementation for now
    const message = `${title ? title + ': ' : ''}${description || ''}`;
    
    if (variant === "destructive") {
      alert(`❌ ${message}`);
    } else {
      alert(`✅ ${message}`);
    }
  };

  return { toast };
}
