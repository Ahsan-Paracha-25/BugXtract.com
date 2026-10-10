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
      {`requestAnimationFrame(() => document.getElementById(${JSON.stringify(section)})?.scrollIntoView({ behavior: "smooth", block: "start" }));`}
    </Script>
  </>;
}
