"use client"

import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatNaira } from '@/lib/currency'
import { toast } from 'sonner'

export function WelcomeBonusSettings() {
  const [value, setValue] = useState('')
  const [fallback, setFallback] = useState(0)
  const [auditTrail, setAuditTrail] = useState<Array<{
    id: number
    old_value: string | null
    new_value: string
    changed_by_email: string | null
    created_at: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadSetting() {
      try {
        const res = await fetch('/api/admin/settings/welcome-bonus')
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load setting')
        }

        setValue(String(data.value ?? '0'))
        setFallback(Number(data.fallback ?? 0))
        setAuditTrail(data.auditTrail ?? [])
      } catch (error) {
        console.error('[Welcome Bonus Settings] Load error:', error)
        toast.error('Failed to load welcome bonus setting')
      } finally {
        setLoading(false)
      }
    }

    loadSetting()
  }, [])

  async function handleSave() {
    setSaving(true)

    try {
      const res = await fetch('/api/admin/settings/welcome-bonus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: Number(value) }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save setting')
      }

      setValue(String(data.value))
      toast.success(`Welcome bonus updated to ${formatNaira(Number(data.value))}`)

      const refreshRes = await fetch('/api/admin/settings/welcome-bonus')
      const refreshData = await refreshRes.json()
      if (refreshRes.ok) {
        setAuditTrail(refreshData.auditTrail ?? [])
      }
    } catch (error) {
      console.error('[Welcome Bonus Settings] Save error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update welcome bonus')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Welcome Bonus</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the balance credited to new buyers at signup. If no saved setting exists, the fallback is {formatNaira(fallback)}.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading setting...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Bonus Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-[#38bdf8] focus:outline-none"
            />
          </div>

          <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
            Buyers who sign up after this change will receive <span className="font-semibold text-foreground">{formatNaira(Number(value || 0))}</span> and a matching balance history entry.
          </div>

          <Button onClick={handleSave} disabled={saving} className="bg-[#38bdf8] text-white hover:bg-[#0ea5e9]">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Bonus
              </>
            )}
          </Button>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Audit Trail</h3>
              <span className="text-xs text-muted-foreground">Recent changes</span>
            </div>

            {auditTrail.length === 0 ? (
              <p className="text-sm text-muted-foreground">No welcome bonus changes recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {auditTrail.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-border bg-background px-4 py-3">
                    <p className="text-sm font-medium text-foreground">
                      {formatNaira(Number(entry.old_value ?? fallback))} to {formatNaira(Number(entry.new_value))}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.changed_by_email || 'Unknown admin'} · {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}