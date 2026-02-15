import { Suspense } from "react";
import { VerifyEmailContent } from "./VerifyEmailContent";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4 sm:p-6 max-w-md min-h-screen flex items-center justify-center">Laden...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
