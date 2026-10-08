import Script from "next/script";
import landingBody from "../public/landing-body.html?raw";
import css from "../public/site.css?raw";
import qualityCss from "../public/quality-command-center.css?raw";
import serviceCardsCss from "../public/service-cards.css?raw";
import howItWorksCss from "../public/how-it-works.css?raw";
import productsDialogCss from "../public/products-dialog.css?raw";

export const dynamic = "force-dynamic";

export default function Home() {
  return <><style dangerouslySetInnerHTML={{ __html: css }} /><style dangerouslySetInnerHTML={{ __html: qualityCss }} /><style dangerouslySetInnerHTML={{ __html: serviceCardsCss }} /><style dangerouslySetInnerHTML={{ __html: howItWorksCss }} /><style dangerouslySetInnerHTML={{ __html: productsDialogCss }} />
    <div dangerouslySetInnerHTML={{ __html: landingBody }} />
    <Script src="/legacy.js" strategy="afterInteractive" />
    <Script src="/pricing.js" strategy="afterInteractive" />
  </>;
}
