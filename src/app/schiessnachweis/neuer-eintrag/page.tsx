import { Suspense } from "react";
import { NeuerEintragContent } from "./NeuerEintragContent";

export default function NeuerEintragPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4 sm:p-6 max-w-4xl">Laden...</div>}>
      <NeuerEintragContent />
    </Suspense>
  );
}
