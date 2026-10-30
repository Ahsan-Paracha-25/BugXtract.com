import Script from "next/script";
import landingBody from "../public/landing-body.html?raw";
import css from "../public/site.css?raw";
import qualityCss from "../public/quality-command-center.css?raw";
import serviceCardsCss from "../public/service-cards.css?raw";
import howItWorksCss from "../public/how-it-works.css?raw";
import productsDialogCss from "../public/products-dialog.css?raw";
import pricingDiscountsCss from "../public/pricing-discounts.css?raw";
import retainersCss from "../public/retainers.css?raw";
import customerReviewsCss from "../public/customer-reviews.css?raw";
import trustMetricsCss from "../public/trust-metrics.css?raw";
import colorSchemeCss from "../public/color-scheme.css?raw";
import growthSections from "../public/growth-sections.html?raw";
import growthSectionsCss from "../public/growth-sections.css?raw";

export const dynamic = "force-dynamic";

export default function Home() {
  const bodyWithGrowthSections = landingBody.replace("</main><footer>", `${growthSections}</main><footer>`);

  return <><style dangerouslySetInnerHTML={{ __html: css }} /><style dangerouslySetInnerHTML={{ __html: qualityCss }} /><style dangerouslySetInnerHTML={{ __html: serviceCardsCss }} /><style dangerouslySetInnerHTML={{ __html: howItWorksCss }} /><style dangerouslySetInnerHTML={{ __html: productsDialogCss }} /><style dangerouslySetInnerHTML={{ __html: pricingDiscountsCss }} /><style dangerouslySetInnerHTML={{ __html: retainersCss }} /><style dangerouslySetInnerHTML={{ __html: customerReviewsCss }} /><style dangerouslySetInnerHTML={{ __html: trustMetricsCss }} /><style dangerouslySetInnerHTML={{ __html: colorSchemeCss }} /><style dangerouslySetInnerHTML={{ __html: growthSectionsCss }} />
    <div dangerouslySetInnerHTML={{ __html: bodyWithGrowthSections }} />
    <Script src="/legacy.js" strategy="afterInteractive" />
    <Script src="/pricing.js?v=live-pricing-20261008" strategy="afterInteractive" />
    <Script src="/reviews.js?v=persistent-thumbnails-20261030" strategy="afterInteractive" />
    <Script src="/trust-metrics.js?v=viewport-20261011" strategy="afterInteractive" />
    <Script src="/scroll-animations.js?v=20261011-2" strategy="afterInteractive" />
    <Script src="/growth-sections.js?v=20261030-1" strategy="afterInteractive" />
  </>;
}
