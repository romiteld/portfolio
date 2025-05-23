"use client"

import Link from "next/link"
import { useRouter, notFound } from "next/navigation"
import { X } from "lucide-react"
import { demos } from "@/lib/demosData"
import DemoNavigation from "@/app/components/DemoNavigation"

export default function DemoPage({ params }: { params: { demo: string } }) {
  const router = useRouter()
  const demo = demos.find((d) => d.slug === params.demo)

  if (!demo) {
    notFound()
  }

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

      <h1 className="text-3xl font-bold mb-4">{demo.title}</h1>
      <p className="text-gray-700 dark:text-gray-300 mb-8">{demo.description}</p>

      <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg mb-8">
        <p className="text-lg font-semibold mb-4">Demo Interface</p>
        <p>Placeholder for the {demo.title} interface. Coming soon for full functionality...</p>
      </div>

      <DemoNavigation />
    </main>
  )
}

