'use client'

import dynamic from 'next/dynamic'
import ClientOnly from '@/app/components/ClientOnly'
import DemoNavigation from '@/app/components/DemoNavigation'

const SalesAgent = dynamic(() => import('./components/SalesAgent'), { ssr: false })

export default function AiSalesAgentPage() {
  return (
    <div className="p-4">
      <ClientOnly>
        <SalesAgent />
      </ClientOnly>
      <DemoNavigation />
    </div>
  )
}
