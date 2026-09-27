"use client"

import { useState } from "react"
import { NewsletterCampaignForm } from "./NewsletterCampaignForm"
import { NewsletterTemplateBar } from "./NewsletterTemplateBar"

/**
 * Composer shell.
 *
 * The subject and body live here rather than inside either child: the template
 * bar writes to them, and the campaign form reads them. Without this the two
 * components would each keep private copies and loading a template would leave
 * the form showing the old text.
 */
export function NewsletterComposer({
  activeCount,
  adminEmail,
}: {
  activeCount: number
  adminEmail?: string
}) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")

  return (
    <div className="space-y-8">
      <NewsletterTemplateBar
        subject={subject}
        body={body}
        onLoad={(t) => {
          setSubject(t.subject)
          setBody(t.body)
        }}
      />
      <NewsletterCampaignForm
        subject={subject}
        body={body}
        onSubjectChange={setSubject}
        onBodyChange={setBody}
        activeCount={activeCount}
        adminEmail={adminEmail}
      />
    </div>
  )
}
