import { DashboardHeader } from '@/components/dashboard/header'
import { BalanceAdjustmentManager } from '@/components/admin/balance-adjustment-manager'
import { WelcomeBonusSettings } from '@/components/admin/welcome-bonus-settings'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Admin Settings"
        description="Configure operational settings used by the buyer experience."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <WelcomeBonusSettings />
        <BalanceAdjustmentManager />
      </div>
    </div>
  )
}