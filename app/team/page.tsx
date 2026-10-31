import teamBody from "../../public/team-body.html?raw";
import teamCss from "../../public/team.css?raw";
import colorSchemeCss from "../../public/color-scheme.css?raw";
import brandLockupCss from "../../public/brand-lockup.css?raw";
import founderProfileCss from "../../public/founder-profile.css?raw";
import founderLayoutCss from "../../public/founder-layout.css?raw";
import founderPolishCss from "../../public/founder-polish.css?raw";
import Script from "next/script";

export const dynamic = "force-dynamic";

export default function TeamPage() {
  const logoVersion = "brand-20261030-2";
  const fullBrandLockup = '<span class="brand-lockup"><span class="precision-wordmark">BugXtract<span>.com</span></span><span class="brand-tagline">Test Deeper. Launch Safer.</span></span>';
  const page = teamBody
    .replaceAll("/bugxtract-logo.svg", `/bugxtract-logo.svg?v=${logoVersion}`)
    .replaceAll('<span class="precision-wordmark">BugXtract<span>.com</span></span>', fullBrandLockup);

  return <>
    <style dangerouslySetInnerHTML={{ __html: teamCss }} />
    <style dangerouslySetInnerHTML={{ __html: "@media(min-width:821px){.team-header{position:fixed;top:0;right:0;left:0;width:100%;z-index:100}.team-header+main{padding-top:86px}}" }} />
    <style dangerouslySetInnerHTML={{ __html: founderProfileCss }} />
    <style dangerouslySetInnerHTML={{ __html: founderLayoutCss }} />
    <style dangerouslySetInnerHTML={{ __html: founderPolishCss }} />
    <style dangerouslySetInnerHTML={{ __html: colorSchemeCss }} />
    <style dangerouslySetInnerHTML={{ __html: brandLockupCss }} />
    <div dangerouslySetInnerHTML={{ __html: page }} />
    <Script src="/founder-profile.js?v=founder-profile-20261031-4" strategy="afterInteractive" />
  </>;
}
