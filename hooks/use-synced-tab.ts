"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Instant tab switches: update local state first, then sync the URL.
 * Avoids waiting on a full navigation (and middleware) before the tab paints.
 */
export function useSyncedTab<T extends string>(
  allowed: readonly T[],
  fallback: T,
  param = "tab"
) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get(param);
  const urlTab = allowed.includes(fromUrl as T) ? (fromUrl as T) : fallback;
  const [tab, setTabState] = useState<T>(urlTab);

  useEffect(() => {
    setTabState(urlTab);
  }, [urlTab]);

  useEffect(() => {
    const onPopState = () => {
      const next = new URLSearchParams(window.location.search).get(param);
      setTabState(allowed.includes(next as T) ? (next as T) : fallback);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [allowed, fallback, param]);

  const setTab = useCallback(
    (next: string) => {
      const value = allowed.includes(next as T) ? (next as T) : fallback;
      setTabState(value);
      const params = new URLSearchParams(searchParams.toString());
      params.set(param, value);
      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      window.history.replaceState(window.history.state, "", href);
    },
    [allowed, fallback, param, pathname, searchParams]
  );

  return [tab, setTab] as const;
}
