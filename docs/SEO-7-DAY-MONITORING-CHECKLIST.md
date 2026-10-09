# SEO 提交后 7 天监控清单（Google + Bing）

适用场景：已完成 GSC / Bing 提交，开始进入收录与排名观察期。

## Day 0（提交当天）

- [ ] `sitemap.xml` 返回 200
- [ ] `robots.txt` 返回 200
- [ ] `llms.txt` 和 `llms-full.txt` 返回 200
- [ ] GSC 成功接收 sitemap
- [ ] Bing 成功接收 sitemap
- [ ] 手动提交 4 个核心 URL（首页、产品页、About、Contact）

## Day 1-2（抓取与覆盖）

- [ ] GSC `Page indexing` 中无异常激增（404 / soft 404 / server error）
- [ ] Bing 抓取统计无明显异常
- [ ] 核心 URL 的 `Last crawl` 已出现
- [ ] 无错误 canonical（应指向自身语言版本）

## Day 3-4（多语言与结构化数据）

- [ ] hreflang 无冲突（语言互链完整）
- [ ] 结构化数据无严重错误（Organization / WebSite / Product / FAQ 等）
- [ ] About/Contact 多语言内容完整（无“英文新增段落缺失”）

## Day 5-7（搜索表现）

- [ ] GSC 展现量（Impressions）出现回升或新增长尾词
- [ ] 点击率（CTR）无明显异常下滑
- [ ] 重点国家/地区（东南亚、非洲等）有曝光数据
- [ ] Bing 的索引页面数量稳定上升

## 每日记录模板（建议复制到内部周报）

```
Date: YYYY-MM-DD

Google Search Console
- Sitemap status:
- Indexing issues:
- Top affected URLs:
- Impressions:
- Clicks:
- Notes:

Bing Webmaster
- Sitemap status:
- Crawl issues:
- Indexed pages trend:
- Notes:

Actions taken today
- 1)
- 2)
```

## 发现异常时的优先处理顺序

1. 先修复 `5xx / 404 / 重定向链`
2. 再修复 `canonical / hreflang` 不一致
3. 再修复页面内容重复、薄内容页面
4. 最后做标题/描述（Title/Description）点击率优化

## 建议的周末复盘输出

- 本周新增收录页数
- 本周错误类型 Top 3 及修复状态
- 本周新增有效查询词（国家 + 语言）
- 下周要推进的 3 个页面优化点
