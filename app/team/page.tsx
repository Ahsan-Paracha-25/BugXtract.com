import teamBody from "../../public/team-body.html?raw";
import teamCss from "../../public/team.css?raw";
import colorSchemeCss from "../../public/color-scheme.css?raw";
import brandLockupCss from "../../public/brand-lockup.css?raw";

export const dynamic = "force-dynamic";

export default function TeamPage() {
  const logoVersion = "brand-20261030-2";
  const fullBrandLockup = '<span class="brand-lockup"><span class="precision-wordmark">BugXtract<span>.com</span></span><span class="brand-tagline">Test Deeper. Launch Safer.</span></span>';
  const page = teamBody
    .replaceAll("/bugxtract-logo.svg", `/bugxtract-logo.svg?v=${logoVersion}`)
    .replaceAll('<span class="precision-wordmark">BugXtract<span>.com</span></span>', fullBrandLockup);

  return <>
    <style dangerouslySetInnerHTML={{ __html: teamCss }} />
    <style dangerouslySetInnerHTML={{ __html: colorSchemeCss }} />
    <style dangerouslySetInnerHTML={{ __html: brandLockupCss }} />
    <div dangerouslySetInnerHTML={{ __html: page }} />
  </>;
}
