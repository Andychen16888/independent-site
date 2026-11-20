import { MetadataRoute } from "next"
import { GENERIC_SITE_DESCRIPTION, GENERIC_SITE_NAME } from "@/lib/settings/brand"

export default function manifest(): MetadataRoute.Manifest {
  const name = process.env.NEXT_PUBLIC_SITE_NAME || GENERIC_SITE_NAME
  const description =
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    GENERIC_SITE_DESCRIPTION
  return {
    name,
    short_name: name,
    description,
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFF0",
    theme_color: "#FFFFF0",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  }
}