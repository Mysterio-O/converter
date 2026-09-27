"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

/**
 * True on the client after hydration, false during SSR and the hydration pass.
 * getSnapshot always returns the primitive `true` (stable under Object.is),
 * so this cannot infinite-loop the way object snapshots do.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, getTrue, getFalse);
}
