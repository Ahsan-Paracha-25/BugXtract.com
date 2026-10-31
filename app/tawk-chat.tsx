"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const tawkScriptId = "bugxtract-tawk-chat";
const tawkScriptUrl = "https://embed.tawk.to/6ae583dda9c079347268f453/1k688m733";

type TawkApi = {
  hideWidget?: () => void;
  showWidget?: () => void;
};

type TawkWindow = Window & typeof globalThis & {
  Tawk_API?: TawkApi;
  Tawk_LoadStart?: Date;
};

/** Loads the public Tawk.to visitor widget and keeps it out of private admin pages. */
export function TawkChat() {
  const pathname = usePathname();

  useEffect(() => {
    const tawkWindow = window as TawkWindow;

    if (pathname.startsWith("/admin")) {
      tawkWindow.Tawk_API?.hideWidget?.();
      return;
    }

    tawkWindow.Tawk_API?.showWidget?.();
    if (document.getElementById(tawkScriptId)) return;

    tawkWindow.Tawk_API = tawkWindow.Tawk_API || {};
    tawkWindow.Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.id = tawkScriptId;
    script.async = true;
    script.src = tawkScriptUrl;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.head.appendChild(script);
  }, [pathname]);

  return null;
}
