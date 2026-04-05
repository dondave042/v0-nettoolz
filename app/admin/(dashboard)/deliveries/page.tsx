'use client'

import { useState } from 'react'
import { Package, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DashboardHeader } from '@/components/dashboard/header'
import { PendingDeliveriesManager } from '@/components/admin/pending-deliveries-manager'

export default function AdminDeliveriesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <DashboardHeader
        title="Product Deliveries"
        description="Manage and deliver products to customers after successful payment"
        icon={Package}
      />

      {/* Pending Deliveries Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Pending Deliveries</h2>
        <PendingDeliveriesManager />
      </div>
    </div>
  )
}
