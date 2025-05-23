'use client'

import dynamic from 'next/dynamic'
import ClientOnly from '@/app/components/ClientOnly'

const InteractiveAgentsDemo = dynamic(() => import('./InteractiveAgentsDemo'), { ssr: false })

export default function InteractiveAgentsPage() {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <ClientOnly>
        <InteractiveAgentsDemo />
      </ClientOnly>
    </div>
  )
}
