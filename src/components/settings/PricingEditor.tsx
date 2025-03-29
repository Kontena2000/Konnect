
import { PricingEditor as MatrixPricingEditor } from "@/components/matrix-calculator/PricingEditor";

export function PricingEditor({ readOnly = false, onSave }: { readOnly?: boolean; onSave?: (pricing: any) => void }) {
  return <MatrixPricingEditor readOnly={readOnly} onSave={onSave} />;
}
