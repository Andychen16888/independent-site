import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  const name = process.env.NEXT_PUBLIC_SITE_NAME || "Global Commerce"
  const description =
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "Premium products for everyday living."
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