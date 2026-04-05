import { getDb } from "@/lib/db"
import { Megaphone } from "lucide-react"

interface Announcement {
  id: number
  title: string
  content: string
}

export async function AnnouncementsBar() {
  const sql = getDb()
  const announcements = await sql`SELECT id, title, content FROM announcements WHERE is_active = true ORDER BY created_at DESC LIMIT 3` as Announcement[]

  if (!announcements.length) return null

  return (
    <div className="bg-[#0ea5e9] text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 lg:px-8">
        <Megaphone className="h-4 w-4 flex-shrink-0" />
        <div className="flex gap-8 overflow-hidden">
          {announcements.map((a) => (
            <p key={a.id} className="whitespace-nowrap text-sm font-medium">
              {a.title}: {a.content}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
