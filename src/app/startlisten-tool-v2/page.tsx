import { Suspense } from "react";
import { StartlistenToolV2Content } from "./StartlistenToolContent";

export default function StartlistenToolV2Page() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6">Laden...</div>}>
      <StartlistenToolV2Content />
    </Suspense>
  );
}
