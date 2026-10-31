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
import mobileResponsiveCss from "../public/mobile-responsive.css?raw";
import brandLockupCss from "../public/brand-lockup.css?raw";
import founderProfileCss from "../public/founder-profile.css?raw";

export const dynamic = "force-dynamic";

export default function Home() {
  const logoVersion = "brand-20261030-2";
  const fullBrandLockup = '<span class="brand-lockup"><span class="precision-wordmark">BugXtract<span>.com</span></span><span class="brand-tagline">Test Deeper. Launch Safer.</span></span>';
  const versionedLandingBody = landingBody
    .replaceAll("bugxtract-logo.svg", `bugxtract-logo.svg?v=${logoVersion}`)
    .replaceAll('<span class="precision-wordmark">BugXtract<span>.com</span></span>', fullBrandLockup)
    .replaceAll('<a href="/products">Products</a><a href="contact/">Contact Us</a>', '<a href="/products">Products</a><a href="/team">Our Team</a><a href="contact/">Contact Us</a>');
  const versionedGrowthSections = growthSections.replaceAll("/bugxtract-logo.svg", `/bugxtract-logo.svg?v=${logoVersion}`);
  const founderTeaser = '<section class="founder-home-teaser" id="founder-home-teaser" aria-labelledby="founder-home-teaser-title" hidden><div class="wrap"><div class="founder-home-teaser-shell"><div class="founder-home-teaser-copy"><div class="eyebrow">Meet the founder</div><h2 id="founder-home-teaser-title"></h2><p id="founder-home-teaser-message"></p></div><a id="founder-home-teaser-link" href="/team#founder-profile">Read founder’s message <span aria-hidden="true">→</span></a></div></div></section>';
  const bodyWithGrowthSections = versionedLandingBody.replace("</main><footer>", `${versionedGrowthSections}${founderTeaser}</main><footer>`);

  return <><style dangerouslySetInnerHTML={{ __html: css }} /><style dangerouslySetInnerHTML={{ __html: qualityCss }} /><style dangerouslySetInnerHTML={{ __html: serviceCardsCss }} /><style dangerouslySetInnerHTML={{ __html: howItWorksCss }} /><style dangerouslySetInnerHTML={{ __html: productsDialogCss }} /><style dangerouslySetInnerHTML={{ __html: pricingDiscountsCss }} /><style dangerouslySetInnerHTML={{ __html: retainersCss }} /><style dangerouslySetInnerHTML={{ __html: customerReviewsCss }} /><style dangerouslySetInnerHTML={{ __html: trustMetricsCss }} /><style dangerouslySetInnerHTML={{ __html: colorSchemeCss }} /><style dangerouslySetInnerHTML={{ __html: growthSectionsCss }} /><style dangerouslySetInnerHTML={{ __html: mobileResponsiveCss }} /><style dangerouslySetInnerHTML={{ __html: brandLockupCss }} /><style dangerouslySetInnerHTML={{ __html: founderProfileCss }} />
    <div dangerouslySetInnerHTML={{ __html: bodyWithGrowthSections }} />
    <Script src="/legacy.js" strategy="afterInteractive" />
    <Script src="/pricing.js?v=live-pricing-20261008" strategy="afterInteractive" />
    <Script src="/reviews.js?v=persistent-thumbnails-20261030" strategy="afterInteractive" />
    <Script src="/trust-metrics.js?v=viewport-20261011" strategy="afterInteractive" />
    <Script src="/scroll-animations.js?v=20261011-2" strategy="afterInteractive" />
    <Script src="/hero-slider.js?v=20261030-2" strategy="afterInteractive" />
    <Script src="/mobile-navigation.js?v=20261030-1" strategy="afterInteractive" />
    <Script src="/growth-sections.js?v=20261030-1" strategy="afterInteractive" />
    <Script src="/founder-profile.js?v=founder-profile-20261031-2" strategy="afterInteractive" />
  </>;
}
