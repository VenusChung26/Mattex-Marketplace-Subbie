import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace(/^#/, "");
      const scrollToHash = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return true;
        }
        return false;
      };
      if (scrollToHash()) return undefined;
      // Home content may mount a tick later (variants / layout)
      const t1 = window.setTimeout(scrollToHash, 50);
      const t2 = window.setTimeout(scrollToHash, 200);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return undefined;
  }, [pathname, search, hash]);

  return null;
}
