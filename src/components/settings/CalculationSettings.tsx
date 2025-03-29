
import { CalculationSettings as MatrixCalculationSettings } from "@/components/matrix-calculator/CalculationSettings";

export function CalculationSettings({ readOnly = false, onSave = null }: { readOnly?: boolean; onSave?: ((params: any) => void) | null }) {
  return <MatrixCalculationSettings readOnly={readOnly} onSave={onSave} />;
}
