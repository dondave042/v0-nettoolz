import { getDb } from './db'
import { getSession, isAuthenticated } from './auth'

type AdminSession = {
    id: number
    email: string
    role?: string
}

let hasRoleColumnCache: boolean | null = null

async function adminUsersHasRoleColumn() {
    if (hasRoleColumnCache !== null) {
        return hasRoleColumnCache
    }

    const sql = getDb()
    const rows = await sql`
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'admin_users'
			AND column_name = 'role'
		LIMIT 1
	`

    hasRoleColumnCache = rows.length > 0
    return hasRoleColumnCache
}

export async function getAdminSession(): Promise<AdminSession | null> {
    const session = await getSession()
    if (!session) {
        return null
    }

    if (session.role) {
        return session as AdminSession
    }

    try {
        const sql = getDb()

        if (await adminUsersHasRoleColumn()) {
            const admins = await sql`
				SELECT id, email, role
				FROM admin_users
				WHERE id = ${session.id}
				LIMIT 1
			`

            if (admins.length > 0) {
                return {
                    id: admins[0].id,
                    email: admins[0].email,
                    role: admins[0].role || 'admin',
                }
            }
        }
    } catch {
        // If role lookup fails, keep backward-compatible access for existing deployments.
    }

    return {
        id: session.id,
        email: session.email,
        role: 'admin',
    }
}

export { isAuthenticated as isAdminAuthenticated }