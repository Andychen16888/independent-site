export type SettingGroup = "site" | "content" | "contact" | "social" | "seo" | "shipping" | "analytics"

export interface SettingMeta {
  key: string
  group: SettingGroup
  label: string
  labelZh: string
  type: "text" | "textarea" | "richtext" | "url" | "email" | "language" | "currency"
  placeholder?: string
}

export const SETTING_KEYS: SettingMeta[] = [
  { key: "site.name", group: "site", label: "Site Name", labelZh: "站点名称", type: "text", placeholder: "e.g. Global Trade Store" },
  { key: "site.description", group: "site", label: "Site Description", labelZh: "站点描述", type: "textarea" },
  { key: "site.logo", group: "site", label: "Logo URL", labelZh: "Logo 图片地址", type: "url" },
  { key: "site.logoCompany", group: "site", label: "Company Logo URL", labelZh: "公司 Logo 地址", type: "url" },
  { key: "site.favicon", group: "site", label: "Favicon URL", labelZh: "Favicon 图标地址", type: "url" },
  { key: "site.language", group: "site", label: "Default Language", labelZh: "默认语言", type: "language" },
  { key: "site.currency", group: "site", label: "Default Currency", labelZh: "默认货币", type: "currency" },
  { key: "site.promoBar", group: "site", label: "Announcement Bar Text", labelZh: "公告栏文字", type: "text", placeholder: "e.g. Free shipping over $100" },
  { key: "content.brandStory", group: "content", label: "Brand Story Section", labelZh: "品牌故事板块", type: "textarea", placeholder: "Company story shown on the homepage" },
  { key: "content.promo1", group: "content", label: "Feature Promo Section", labelZh: "产品特色板块", type: "textarea", placeholder: "Feature block with benefits list and call-to-action" },
  { key: "content.testimonials", group: "content", label: "Customer Testimonials", labelZh: "客户评价", type: "textarea", placeholder: "Buyer quotes shown in the testimonial area" },
  { key: "content.instagram", group: "content", label: "Instagram Section", labelZh: "Instagram 板块", type: "textarea", placeholder: "Instagram handle, link and featured post images" },
  { key: "content.featuredEyebrow", group: "content", label: "Featured Categories — Overline", labelZh: "精选分类 — 眉题", type: "text", placeholder: "Explore" },
  { key: "content.featuredHeading", group: "content", label: "Featured Categories — Heading", labelZh: "精选分类 — 标题", type: "text", placeholder: "Our Collections" },
  { key: "content.featuredTagline", group: "content", label: "Featured Categories — Tagline", labelZh: "精选分类 — 标语", type: "text" },
  { key: "content.faq", group: "content", label: "FAQ", labelZh: "常见问题", type: "textarea", placeholder: "Frequently asked questions and answers" },
  { key: "company.name", group: "contact", label: "Company Name", labelZh: "公司名称", type: "text" },
  { key: "company.address", group: "contact", label: "Company Address", labelZh: "公司地址", type: "textarea" },
  { key: "company.brief", group: "contact", label: "About / Company Intro", labelZh: "公司简介", type: "textarea" },
  { key: "contact.email", group: "contact", label: "Contact Email", labelZh: "联系邮箱", type: "email" },
  { key: "contact.phone", group: "contact", label: "Contact Phone", labelZh: "联系电话", type: "text" },
  { key: "contact.whatsapp", group: "contact", label: "WhatsApp Number", labelZh: "WhatsApp 号码", type: "text" },
  { key: "contact.hours", group: "contact", label: "Business Hours", labelZh: "营业时间", type: "text", placeholder: "Mon–Fri, 9am–6pm" },
  { key: "footer.about", group: "contact", label: "Footer About Text", labelZh: "页脚关于文字", type: "textarea" },
  { key: "footer.copyright", group: "contact", label: "Copyright Text", labelZh: "版权文字", type: "text", placeholder: "All rights reserved." },
  { key: "social.facebook", group: "social", label: "Facebook URL", labelZh: "Facebook 链接", type: "url" },
  { key: "social.instagram", group: "social", label: "Instagram URL", labelZh: "Instagram 链接", type: "url" },
  { key: "social.linkedin", group: "social", label: "LinkedIn URL", labelZh: "LinkedIn 链接", type: "url" },
  { key: "social.youtube", group: "social", label: "YouTube URL", labelZh: "YouTube 链接", type: "url" },
  { key: "social.twitter", group: "social", label: "X / Twitter URL", labelZh: "X / Twitter 链接", type: "url" },
  { key: "seo.homeTitle", group: "seo", label: "Homepage SEO Title", labelZh: "首页 SEO 标题", type: "text" },
  { key: "seo.homeDescription", group: "seo", label: "Homepage SEO Description", labelZh: "首页 SEO 描述", type: "textarea" },
  { key: "seo.defaultKeywords", group: "seo", label: "Default SEO Keywords", labelZh: "默认 SEO 关键词", type: "textarea" },
  { key: "shipping.freeThreshold", group: "shipping", label: "Free Shipping Threshold (USD)", labelZh: "免运费门槛（美元）", type: "text" },
  { key: "shipping.standardRate", group: "shipping", label: "Standard Shipping Rate (USD)", labelZh: "标准运费（美元）", type: "text" },
  { key: "shipping.standardDays", group: "shipping", label: "Standard Delivery Days", labelZh: "标准送达天数", type: "text" },
  { key: "shipping.expressRate", group: "shipping", label: "Express Shipping Rate (USD)", labelZh: "急件运费（美元）", type: "text" },
  { key: "shipping.expressDays", group: "shipping", label: "Express Delivery Days", labelZh: "急件送达天数", type: "text" },
  { key: "shipping.returnWindow", group: "shipping", label: "Return Window (days)", labelZh: "退货期限（天）", type: "text" },
]

export const SETTING_GROUP_ORDER: SettingGroup[] = ["site", "content", "contact", "social", "seo", "shipping"]

/** JSON map of storefront image slot key -> uploaded URL (managed at /admin/images). */
export const IMAGE_SETTING_KEY = "images.site"

export const ALL_SETTING_KEYS = [...SETTING_KEYS.map((s) => s.key), IMAGE_SETTING_KEY]