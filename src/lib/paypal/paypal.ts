import { getSiteSeo } from "@/lib/settings/settings"

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET
const PAYPAL_API_URL = process.env.PAYPAL_API_URL || "https://api-m.paypal.com"

// 外部 API 调用必须有超时兜底，否则 PayPal 端卡住时请求永远挂起，
// 会被 nginx 判为 "504 Gateway Time-out"。
const PAYPAL_TIMEOUT_MS = 30_000

async function paypalFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(PAYPAL_TIMEOUT_MS),
  })
}

export async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64")

  const res = await paypalFetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  })

  const data = await res.json()
  return data.access_token
}

export async function createPayPalOrder(amount: number, currency: string = "USD") {
  const accessToken = await getPayPalAccessToken()
  const siteName = (await getSiteSeo()).siteName

  const res = await paypalFetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: `${siteName} Order`,
        },
      ],
    }),
  })

  return res.json()
}

export async function capturePayPalOrder(orderId: string) {
  const accessToken = await getPayPalAccessToken()

  const res = await paypalFetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return res.json()
}
