import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oriental Beauty",
    short_name: "Oriental Beauty",
    description: "Premium Peptide Skincare & Artisanal Living",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFF0",
    theme_color: "#FFFFF0",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  }
}
