import teamBody from "../../public/team-body.html?raw";
import teamCss from "../../public/team.css?raw";
import colorSchemeCss from "../../public/color-scheme.css?raw";
import brandLockupCss from "../../public/brand-lockup.css?raw";
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
    <style dangerouslySetInnerHTML={{ __html: ".team-founder{padding:82px 0;background:linear-gradient(125deg,#f7fbff,#e9f7ff);color:#0c2340}.team-founder-shell{display:grid;grid-template-columns:minmax(230px,.55fr) minmax(0,1fr);gap:58px;align-items:center;max-width:1040px;margin:auto;padding:38px;border:1px solid #d7e7f3;border-radius:22px;background:#fff;box-shadow:0 18px 44px #0d426814}.team-founder-photo{width:min(100%,285px);aspect-ratio:1;margin:auto;overflow:hidden;border:8px solid #eaf5ff;border-radius:24px;background:linear-gradient(135deg,#135de3,#52e6e0);box-shadow:0 18px 34px #123d751f}.team-founder-photo img{width:100%;height:100%;object-fit:cover}.team-founder-copy .team-eyebrow{color:#1078c7}.team-founder-copy h2{margin:0;color:#0c2340;font-family:Manrope,Arial,sans-serif;font-size:clamp(30px,3vw,42px);letter-spacing:-1.4px;line-height:1.12}.team-founder-role{margin:8px 0 17px;color:#1463ff;font-size:15px;font-weight:800}.team-founder-introduction{margin:0 0 14px;color:#294b68;font-size:18px;font-weight:650;line-height:1.55}.team-founder-message{margin:0;color:#526b83;font-size:15px;line-height:1.75;white-space:pre-line}.team-founder-focus{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:24px 0;padding:0;list-style:none}.team-founder-focus li{padding:11px 12px;border:1px solid #d8e8f4;border-radius:9px;background:#f7fbff;color:#214866;font-size:13px;font-weight:700;line-height:1.4}.team-founder-focus li:before{content:'✓';margin-right:7px;color:#0c9f95}@media(min-width:821px){.team-header{position:fixed;top:0;right:0;left:0;width:100%;z-index:100}.team-header+main{padding-top:86px}}@media(max-width:820px){.team-founder{padding:58px 0}.team-founder-shell{grid-template-columns:1fr;gap:27px;padding:28px}.team-founder-photo{width:min(245px,100%);margin:0}.team-founder-focus{grid-template-columns:1fr}}" }} />
    <style dangerouslySetInnerHTML={{ __html: colorSchemeCss }} />
    <style dangerouslySetInnerHTML={{ __html: brandLockupCss }} />
    <div dangerouslySetInnerHTML={{ __html: page }} />
    <Script src="/founder-profile.js?v=founder-profile-20261031-1" strategy="afterInteractive" />
  </>;
}
