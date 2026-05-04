import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { INTERNAL_PORTAL_TRANSLATIONS } from "../i18n/internalPortalTranslations";

/** Authenticated internal portal (`/ppaa-internal-portal`, etc.) */
export const INTERNAL_PORTAL_LOCALE_KEY = "ppaa_internal_portal_locale";
/** Public landing dashboard (`/`) — defaults to English when unset */
export const PUBLIC_PORTAL_LOCALE_KEY = "ppaa_public_portal_locale";

const InternalPortalI18nContext = createContext(null);

function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function readLocaleFromKey(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const s = (raw || "").trim().toLowerCase();
    if (s === "sw" || s === "en") return s;
  } catch {
    /* ignore */
  }
  return "en";
}

function storageKeyForPathname(pathname) {
  return pathname === "/" ? PUBLIC_PORTAL_LOCALE_KEY : INTERNAL_PORTAL_LOCALE_KEY;
}

export function InternalPortalI18nProvider({ children }) {
  const location = useLocation();

  const [locale, setLocaleState] = useState(() => {
    if (typeof window === "undefined") return "en";
    const key = storageKeyForPathname(window.location.pathname || "/");
    return readLocaleFromKey(key);
  });

  // When switching between public home (`/`) and the rest of the app, load the
  // locale saved for that area (public defaults to English if never set).
  useLayoutEffect(() => {
    const key = storageKeyForPathname(location.pathname);
    setLocaleState(readLocaleFromKey(key));
  }, [location.pathname]);

  useEffect(() => {
    try {
      document.documentElement.lang = locale === "sw" ? "sw" : "en";
    } catch {
      /* ignore */
    }
  }, [locale]);

  const setLocale = useCallback(
    (next) => {
      if (next !== "en" && next !== "sw") return;
      setLocaleState(next);
      try {
        const key = storageKeyForPathname(location.pathname);
        localStorage.setItem(key, next);
      } catch {
        /* ignore */
      }
    },
    [location.pathname],
  );

  const bundle =
    INTERNAL_PORTAL_TRANSLATIONS[locale] || INTERNAL_PORTAL_TRANSLATIONS.en;

  const t = useCallback(
    (key, vars) => {
      let str =
        getByPath(bundle, key) ??
        getByPath(INTERNAL_PORTAL_TRANSLATIONS.en, key) ??
        key;
      if (vars && typeof str === "string") {
        Object.keys(vars).forEach((k) => {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k] ?? ""));
        });
      }
      return str;
    },
    [bundle],
  );

  const translateMenuLink = useCallback(
    (link, fallback) => {
      const map = bundle.menuByLink || {};
      if (link && map[link] != null && map[link] !== "") return map[link];
      return fallback;
    },
    [bundle],
  );

  const translateMenuText = useCallback(
    (label, fallback) => {
      const map = bundle.menuByText || {};
      if (label && map[label] != null && map[label] !== "") return map[label];
      return fallback ?? label;
    },
    [bundle],
  );

  const translateHeader = useCallback(
    (header, fallback) => {
      if (!header) return fallback || "";
      const map = bundle.headers || {};
      if (map[header] != null) return map[header];
      return fallback;
    },
    [bundle],
  );

  const translateMenuItem = useCallback(
    (link, text) => {
      const map = bundle.menuByLink || {};
      if (link && map[link] != null && map[link] !== "") return map[link];
      return translateMenuText(text, text);
    },
    [bundle, translateMenuText],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      translateMenuLink,
      translateMenuText,
      translateHeader,
      translateMenuItem,
    }),
    [
      locale,
      setLocale,
      t,
      translateMenuLink,
      translateMenuText,
      translateHeader,
      translateMenuItem,
    ],
  );

  return (
    <InternalPortalI18nContext.Provider value={value}>
      {children}
    </InternalPortalI18nContext.Provider>
  );
}

export function useInternalPortalI18n() {
  const ctx = useContext(InternalPortalI18nContext);
  if (!ctx) {
    return {
      locale: "en",
      setLocale: () => {},
      t: (k) => k,
      translateMenuLink: (_l, f) => f,
      translateMenuText: (_l, f) => f,
      translateHeader: (_h, f) => f,
      translateMenuItem: (_l, text) => text,
    };
  }
  return ctx;
}
