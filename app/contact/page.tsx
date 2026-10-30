import Script from "next/script";
import contactBody from "../../public/contact-body.html?raw";
import css from "../../public/contact.css?raw";
import socialCss from "../../public/social-links.css?raw";
import colorSchemeCss from "../../public/color-scheme.css?raw";

export const dynamic = "force-dynamic";

export default function Contact() {
  const logoVersion = "brand-20261030-2";
  const socialLinks = `<nav class="social-follow contact-social" aria-label="Follow BugXtract"><span class="social-follow-label">Follow BugXtract</span><a class="social-follow-link" href="https://www.facebook.com/profile.php?id=61595187271380" target="_blank" rel="noopener noreferrer" aria-label="Follow BugXtract on Facebook">f</a><a class="social-follow-link" href="https://www.youtube.com/@BugXtract" target="_blank" rel="noopener noreferrer" aria-label="Follow BugXtract on YouTube">▶</a><a class="social-follow-link" href="https://www.instagram.com/bugxtract" target="_blank" rel="noopener noreferrer" aria-label="Follow BugXtract on Instagram">◎</a><a class="social-follow-link" href="https://www.tiktok.com/@bugxtract.com" target="_blank" rel="noopener noreferrer" aria-label="Follow BugXtract on TikTok">♪</a><a class="social-follow-link" href="https://www.linkedin.com/company/bugxtract-com/posts/" target="_blank" rel="noopener noreferrer" aria-label="Follow BugXtract on LinkedIn">in</a></nav>`;
  const bodyWithSocialLinks = contactBody.replaceAll("/bugxtract-logo.svg", `/bugxtract-logo.svg?v=${logoVersion}`).replace(
    '</p></div><div class="contact-layout">',
    `</p>${socialLinks}</div><div class="contact-layout">`,
  );

  return <><style dangerouslySetInnerHTML={{ __html: css }} />
    <style dangerouslySetInnerHTML={{ __html: socialCss }} />
    <style dangerouslySetInnerHTML={{ __html: colorSchemeCss }} />
    <div dangerouslySetInnerHTML={{ __html: bodyWithSocialLinks }} />
    <Script src="/contact.js?v=automatic-contact-email-20261008-1" strategy="afterInteractive" />
  </>;
}
