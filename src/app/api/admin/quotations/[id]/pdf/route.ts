import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { prisma } from "@/lib/db/prisma"
import { buildQuotationPdf } from "@/lib/sales/quotation-document"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

/**
 * Streams the quotation as a PDF.
 *
 * Rendered on demand rather than cached to disk: the document is small, the
 * generator is pure, and a stale PDF in a temp directory is a support incident
 * waiting to happen when a price is corrected.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  const { id } = await params
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    select: { quotationNo: true },
  })
  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
  }

  let pdf: Buffer
  try {
    pdf = await buildQuotationPdf(id)
  } catch (e) {
    console.error("Quotation PDF render failed", e)
    return NextResponse.json({ error: "Failed to render quotation" }, { status: 500 })
  }

  // Node buffer -> BodyInit: a plain Uint8Array view avoids a needless copy.
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.length),
      "Content-Disposition": `attachment; filename="${quotation.quotationNo}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
