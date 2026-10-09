# Google + Bing SEO 提交流程（可直接执行）

适用站点：`https://你的域名`

## 1) 提交前检查（上线后先做）

确保以下地址都返回 `200`：

- `https://你的域名/sitemap.xml`
- `https://你的域名/robots.txt`
- `https://你的域名/llms.txt`
- `https://你的域名/llms-full.txt`

建议再抽查 4 个核心页面：

- `https://你的域名/en`
- `https://你的域名/en/products`
- `https://你的域名/en/pages/about`
- `https://你的域名/en/pages/contact`

## 2) Google Search Console（GSC）提交流程

### A. 添加属性

1. 访问：<https://search.google.com/search-console>
2. 先添加 **Domain property**（推荐）
3. 按提示做 DNS TXT 验证
4. 可额外添加 **URL prefix property**（便于细分管理）

### B. 站点验证（代码方式）

如你用环境变量注入验证码，生产环境需配置：

- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`

部署后页面会输出 Google 验证 meta 标签。

### C. 提交 Sitemap

在 GSC 左侧 `Sitemaps` 提交：

- `https://你的域名/sitemap.xml`

### D. 手动请求收录（首批关键页面）

在 `URL Inspection` 逐条提交：

- `https://你的域名/en`
- `https://你的域名/en/products`
- `https://你的域名/en/pages/about`
- `https://你的域名/en/pages/contact`

### E. 提交后观察点

- `Page indexing`：是否出现大量 `Excluded` / `Crawled - currently not indexed`
- `Sitemaps`：是否成功读取、是否有 URL 错误
- `Enhancements` / 结构化数据：是否有 schema 报错

## 3) Bing Webmaster Tools 提交流程

### A. 添加站点

1. 访问：<https://www.bing.com/webmasters>
2. 添加 `https://你的域名`
3. 验证方式推荐 DNS（也可 meta tag）

### B. 站点验证（代码方式）

生产环境配置：

- `NEXT_PUBLIC_BING_VERIFICATION`

部署后页面会输出 Bing 验证 meta 标签（`msvalidate.01`）。

### C. 提交 Sitemap

在 Bing 提交：

- `https://你的域名/sitemap.xml`

### D. 手动提交关键 URL

在 `URL Inspection` / `Submit URLs` 提交：

- `https://你的域名/en`
- `https://你的域名/en/products`
- `https://你的域名/en/pages/about`
- `https://你的域名/en/pages/contact`

### E. 打开 IndexNow（建议）

- 在 Bing 后台启用 IndexNow
- 后续新页面/改版页面可更快被发现

## 4) 可复制模板（提交记录）

```
Site: https://你的域名
Submitted by: <姓名>
Date: <YYYY-MM-DD>

[Google Search Console]
- Property Type: Domain / URL prefix
- Verified: Yes / No
- Sitemap Submitted: https://你的域名/sitemap.xml
- URL Inspection submitted:
  1) https://你的域名/en
  2) https://你的域名/en/products
  3) https://你的域名/en/pages/about
  4) https://你的域名/en/pages/contact

[Bing Webmaster]
- Site Verified: Yes / No
- Sitemap Submitted: https://你的域名/sitemap.xml
- URL Inspection submitted:
  1) https://你的域名/en
  2) https://你的域名/en/products
  3) https://你的域名/en/pages/about
  4) https://你的域名/en/pages/contact
- IndexNow Enabled: Yes / No
```

## 5) 常见问题与快速处理

- 验证失败：先确认环境变量已在生产环境生效并重启服务。
- Sitemap 读取失败：检查 `robots.txt` 是否可访问，`sitemap.xml` 是否返回 200。
- URL 提交后未收录：先看页面质量、内部链接、重复内容和 canonical 是否一致。
