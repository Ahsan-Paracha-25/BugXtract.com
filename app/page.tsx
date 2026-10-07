import Script from "next/script";
import landingBody from "../public/landing-body.html?raw";
import css from "../public/site.css?raw";

export const dynamic = "force-dynamic";

export default function Home() {
  return <><style dangerouslySetInnerHTML={{ __html: css }} />
    <div dangerouslySetInnerHTML={{ __html: landingBody }} />
    <Script src="/legacy.js" strategy="afterInteractive" />
    <Script src="/pricing.js" strategy="afterInteractive" />
  </>;
}
