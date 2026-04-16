// DEPRECATED: This page component should not be under app/api/. DELETE this file.
export default function DeprecatedPage() { return null }
id: number
title: string
content: string
is_active: boolean
created_at: string
}

const emptyForm = { title: "", content: "", is_active: true }

export default function AnnouncementsAdminPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchAnnouncements = useCallback(async () => {
    const res = await fetch("/api/admin/announcements")
    if (res.ok) setAnnouncements(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  function openCreate() {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(a: Announcement) {
    setForm({ title: a.title, content: a.content, is_active: a.is_active })
    setEditId(a.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const method = editId ? "PUT" : "POST"
    const body = editId ? { ...form, id: editId } : form

    try {
      const res = await fetch("/api/admin/announcements", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success(editId ? "Announcement updated!" : "Announcement created!")
      setShowForm(false)
      fetchAnnouncements()
    } catch {
      toast.error("Failed to save announcement")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this announcement?")) return
    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Announcement deleted!")
      fetchAnnouncements()
    } catch {
      toast.error("Failed to delete announcement")
    }
  }

  async function toggleActive(a: Announcement) {
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...a, is_active: !a.is_active }),
      })
      if (!res.ok) throw new Error()
      toast.success(a.is_active ? "Announcement hidden" : "Announcement shown")
      fetchAnnouncements()
    } catch {
      toast.error("Failed to update announcement")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#38bdf8]" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-heading)] text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground">Manage site announcements</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]">
          <Plus className="h-4 w-4" /> Add Announcement
        </Button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {editId ? "Edit Announcement" : "New Announcement"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Content</label>
                <textarea required rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none" />
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded border-border accent-[#38bdf8]" />
                Active (visible on site)
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="flex flex-col gap-4">
        {announcements.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{a.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                    {a.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{a.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Created: {new Date(a.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => toggleActive(a)} aria-label="Toggle visibility">
                  {a.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openEdit(a)} aria-label="Edit announcement">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(a.id)} className="text-destructive hover:text-destructive" aria-label="Delete announcement">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No announcements yet. Create your first one!
          </div>
        )}
      </div>
    </div>
  )
}
