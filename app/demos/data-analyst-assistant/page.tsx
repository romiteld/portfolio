'use client';

import React from 'react';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Import ClientOnly to prevent SSR issues
import ClientOnly from '@/app/components/ClientOnly';

// Dynamically import the DataAnalystAssistant component with SSR disabled
const DataAnalystAssistant = dynamic(
  () => import('./components/DataAnalystAssistant'),
  { ssr: false }
);

import './styles.css';

export default function DataAnalystAssistantPage() {
  return (
    <div className="data-analyst-root">
      <ClientOnly>
        <DataAnalystAssistant />
      </ClientOnly>
    </div>
  );
}