"use client";

import dynamic from "next/dynamic";
import ClientOnly from "@/app/components/ClientOnly";

const EnhancedRAGDemo = dynamic(() => import("./components/EnhancedRAGDemo"), {
  ssr: false,
});

export default function EnhancedRAGPage() {
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <ClientOnly>
        <EnhancedRAGDemo />
      </ClientOnly>
    </div>
  );
}
