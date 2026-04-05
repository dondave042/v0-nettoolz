declare module 'next/headers' {
  export interface RequestCookie {
    name: string
    value: string
  }

  export interface RequestCookies {
    get(name: string): RequestCookie | undefined
    has(name: string): boolean
    keys(): string[]
  }

  export function cookies(): RequestCookies
  export function headers(): Headers
  export function draftMode(): { isEnabled: boolean; enable(): void; disable(): void }
}

declare module 'next/server' {
  export interface NextResponseInit {
    status?: number
    headers?: HeadersInit
  }

  export class NextResponse {
    readonly status: number
    readonly headers: Headers
    constructor(body?: BodyInit | null, init?: NextResponseInit)
    static json(body: any, init?: NextResponseInit): NextResponse
    static redirect(url: string | URL, status?: number): NextResponse
  }
}
