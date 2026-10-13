export type DeviceType = "desktop" | "mobile" | "tablet" | "unknown"

const DEVICE_TYPES: DeviceType[] = ["desktop", "mobile", "tablet"]

/**
 * Infer the device type from a User-Agent string (server side, and fallback
 * for the client beacon).
 *
 * Order matters: tablets are detected first (iPad, an explicit "tablet"
 * token, or an Android UA that does not carry the "mobile" token), then
 * phones (Mobi / iPhone / Android-with-mobile / Windows Phone / Opera Mini).
 * Everything else with a UA is treated as desktop. No UA -> unknown.
 */
export function detectDeviceType(userAgent: string | null | undefined): DeviceType {
  const ua = (userAgent || "").toLowerCase()
  if (!ua) return "unknown"

  if (
    ua.includes("ipad") ||
    ua.includes("tablet") ||
    (ua.includes("android") && !ua.includes("mobile"))
  ) {
    return "tablet"
  }

  if (
    ua.includes("mobi") ||
    ua.includes("iphone") ||
    (ua.includes("android") && ua.includes("mobile")) ||
    ua.includes("wp-") ||
    ua.includes("opera mini")
  ) {
    return "mobile"
  }

  return "desktop"
}

/**
 * Browser-side detection used by the tracking beacon. It is more accurate
 * than UA parsing alone because iPadOS 13+ reports a desktop Macintosh UA;
 * the number of touch points lets us still recognize iPads. Returns null
 * when no heuristic matches so the server can fall back to its UA rules.
 */
export function detectClientDeviceType(): DeviceType | null {
  try {
    const ua = (navigator.userAgent || "").toLowerCase()

    // Android tablets (UA has "android" but no "mobile") and iPads / iPadOS 13+
    // (Macintosh UA) advertise touch support.
    const touchPoints = navigator.maxTouchPoints ?? 0
    if (
      ua.includes("ipad") ||
      ua.includes("tablet") ||
      (ua.includes("android") && !ua.includes("mobile")) ||
      (ua.includes("macintosh") && touchPoints > 1)
    ) {
      return "tablet"
    }

    if (
      ua.includes("mobi") ||
      ua.includes("iphone") ||
      (ua.includes("android") && ua.includes("mobile")) ||
      ua.includes("wp-") ||
      ua.includes("opera mini")
    ) {
      return "mobile"
    }

    // A touch-only surface that is not a tablet is almost always a phone.
    if (touchPoints > 0 && !ua.includes("windows")) return "mobile"
  } catch {
    return null
  }

  return null
}

export function isKnownDeviceType(value: string | null | undefined): value is DeviceType {
  return DEVICE_TYPES.includes(value as DeviceType)
}