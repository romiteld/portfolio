"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { notFound } from "next/navigation"
import { X } from "lucide-react"
import { demos } from "@/lib/demosData"

export default function DemoPage({ params }: { params: { demo: string } }) {
  const router = useRouter()
  const demo = demos.find((d) => d.slug === params.demo)

  if (!demo) {
    notFound()
  }

  const currentIndex = demos.findIndex((d) => d.slug === params.demo)
  const prevDemo = currentIndex > 0 ? demos[currentIndex - 1] : null
  const nextDemo = currentIndex < demos.length - 1 ? demos[currentIndex + 1] : null

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      {/* Close button */}
      <button
        onClick={() => router.push("/demos")}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Close demo"
      >
        <X className="h-6 w-6" />
      </button>

      <Link href="/demos" className="text-blue-500 hover:underline mb-4 inline-block">
        ← Back to All Demos
      </Link>

      <h1 className="text-3xl font-bold mb-4">{demo.title}</h1>
      <p className="text-gray-700 dark:text-gray-300 mb-8">{demo.description}</p>

      <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg mb-8">
        <p className="text-lg font-semibold mb-4">Demo Interface</p>
        <p>Placeholder for the {demo.title} interface. Coming soon for full functionality...</p>
      </div>

      <div className="flex justify-between">
        {prevDemo && (
          <Link href={`/demos/${prevDemo.slug}`} className="text-blue-500 hover:underline">
            ← {prevDemo.title}
          </Link>
        )}
        {nextDemo && (
          <Link href={`/demos/${nextDemo.slug}`} className="text-blue-500 hover:underline">
            {nextDemo.title} →
          </Link>
        )}
      </div>
    </main>
  )
}

