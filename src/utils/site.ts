import type { SiteConfig } from "@blog/types";

/** 首页介绍区：站点描述由本模板的 siteFields 声明，留空时不显示。 */
export function siteHero(site: SiteConfig) {
  const description =
    typeof site.fields?.description === "string"
      ? site.fields.description.trim()
      : "";
  return description ? { title: site.title, description } : undefined;
}
