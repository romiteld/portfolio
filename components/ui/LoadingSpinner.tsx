"use client";

import React from "react";

type SpinnerSize = "small" | "medium" | "large";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeMap = {
  small: "w-4 h-4 border-2",
  medium: "w-8 h-8 border-2",
  large: "w-12 h-12 border-3",
};

export default function LoadingSpinner({ size = "medium", className = "" }: LoadingSpinnerProps) {
  return (
    <div
      className={`inline-block ${sizeMap[size]} border-b-transparent border-blue-500 rounded-full animate-spin ${className}`}
    ></div>
  );
}