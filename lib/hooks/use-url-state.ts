"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export function useUrlState(defaultParams: Record<string, string> = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const getParam = useCallback(
    (key: string): string => {
      return searchParams.get(key) ?? defaultParams[key] ?? "";
    },
    [searchParams, defaultParams],
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== defaultParams[key]) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname, defaultParams],
  );

  const setParams = useCallback(
    (newParams: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
        if (value && value !== defaultParams[key]) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname, defaultParams],
  );

  return { getParam, setParam, setParams, searchParams };
}
