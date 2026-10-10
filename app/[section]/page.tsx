import Script from "next/script";
import { notFound } from "next/navigation";
import Home from "../page";

const sections = new Set(["services", "plans", "retainers", "faq", "products"]);

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.has(section)) notFound();

  return <>
    <Home />
    <Script id={`section-jump-${section}`} strategy="afterInteractive">
      {`if (performance.getEntriesByType("navigation")[0]?.type !== "reload") { const jumpToSection = () => { const target = document.getElementById(${JSON.stringify(section)}); if (!target) return; const headerOffset = 92; const top = target.getBoundingClientRect().top + window.scrollY - headerOffset; window.scrollTo({ top: Math.max(0, top), behavior: "smooth" }); }; window.setTimeout(jumpToSection, 250); window.setTimeout(jumpToSection, 900); }`}
    </Script>
  </>;
}
