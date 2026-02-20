"use client"

import { Send, Mail, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function ContactSection() {
  return (
    <section id="contact" className="bg-secondary/50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-[var(--font-heading)] text-3xl font-bold text-foreground md:text-4xl">
              Get in Touch
            </h2>
            <p className="text-muted-foreground">
              Have a question? We&apos;d love to hear from you.
            </p>
          </div>

          <form
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 lg:p-8"
            onSubmit={(e) => {
              e.preventDefault()
              toast.success("Message sent! We'll get back to you shortly.")
              const form = e.target as HTMLFormElement
              form.reset()
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-name" className="text-sm font-medium text-foreground">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  placeholder="Your name"
                  className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#38bdf8] focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#38bdf8] focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/20"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-subject" className="text-sm font-medium text-foreground">
                Subject
              </label>
              <input
                id="contact-subject"
                type="text"
                required
                placeholder="How can we help?"
                className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#38bdf8] focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-message" className="text-sm font-medium text-foreground">
                Message
              </label>
              <textarea
                id="contact-message"
                rows={5}
                required
                placeholder="Tell us more..."
                className="resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#38bdf8] focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/20"
              />
            </div>
            <Button
              type="submit"
              className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
              size="lg"
            >
              <Send className="h-4 w-4" />
              Send Message
            </Button>
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 text-[#38bdf8]" />
              support@nettoolz.com
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4 text-[#38bdf8]" />
              Live Chat Available 24/7
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
