import Script from "next/script";
import contactBody from "../../public/contact-body.html?raw";
import css from "../../public/contact.css?raw";

export const dynamic = "force-dynamic";

export default function Contact() {
  return <><style dangerouslySetInnerHTML={{ __html: css }} />
    <div dangerouslySetInnerHTML={{ __html: contactBody }} />
    <Script src="/contact.js?v=live-pricing-20261008" strategy="afterInteractive" />
  </>;
}
