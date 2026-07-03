import { lazy, Suspense } from "react";

const GlobePremium = lazy(() => import("./globe-premium"));

export function GlobeLazy() {
  return (
    <Suspense
      fallback={
        <div className="relative aspect-square min-h-[320px] w-full">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(45,138,158,0.18), rgba(4,10,20,0) 65%)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#40e0d0]" />
          </div>
        </div>
      }
    >
      <GlobePremium />
    </Suspense>
  );
}
