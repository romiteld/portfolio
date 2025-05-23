"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { demos } from "@/lib/demosData";

export default function DemoNavigation() {
  const pathname = usePathname();
  const slug = pathname.split("/").pop() || "";
  const index = demos.findIndex((d) => d.slug === slug);
  if (index === -1) return null;

  const prevDemo = index > 0 ? demos[index - 1] : null;
  const nextDemo = index < demos.length - 1 ? demos[index + 1] : null;

  return (
    <nav className="mt-8 flex justify-between items-center border-t pt-4">
      {prevDemo ? (
        <Link href={`/demos/${prevDemo.slug}`} className="text-blue-500 hover:underline">
          ← {prevDemo.title}
        </Link>
      ) : <span />}
      <Link href="/demos" className="text-blue-500 hover:underline">
        Back to All Demos
      </Link>
      {nextDemo ? (
        <Link href={`/demos/${nextDemo.slug}`} className="text-blue-500 hover:underline">
          {nextDemo.title} →
        </Link>
      ) : <span />}
    </nav>
  );
}
