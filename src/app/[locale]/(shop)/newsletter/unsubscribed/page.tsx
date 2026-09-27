import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { Container } from "@/components/ui/Container"

export const dynamic = "force-dynamic"

type Status = "ok" | "already" | "invalid"

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string }>
}

export default async function UnsubscribedPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { status } = await searchParams
  const t = await getTranslations({ locale, namespace: "newsletter.unsubscribed" })

  const view: Record<Status, { title: string; body: string }> = {
    ok: { title: t("removedTitle"), body: t("removedBody") },
    already: { title: t("alreadyTitle"), body: t("alreadyBody") },
    invalid: { title: t("invalidTitle"), body: t("invalidBody") },
  }
  const current = (["ok", "already", "invalid"] as const).includes(status as Status)
    ? (status as Status)
    : "invalid"

  return (
    <section className="section-padding bg-ivory">
      <Container>
        <div className="max-w-xl mx-auto text-center">
          <h1 className="heading-lg mb-6">{view[current].title}</h1>
          <p className="text-body mb-10">{view[current].body}</p>
          <Link href={`/${locale}/products`} className="btn-outline inline-flex">
            {t("browse")}
          </Link>
        </div>
      </Container>
    </section>
  )
}
