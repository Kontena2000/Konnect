import { PricingEditor as MatrixPricingEditor } from '@/components/matrix-calculator/PricingEditor';

interface PricingEditorProps {
  readOnly?: boolean;
  onSave?: (pricing: any) => void;
}

export function PricingEditor({ readOnly = false, onSave }: PricingEditorProps) {
  return <MatrixPricingEditor readOnly={readOnly} onSave={onSave} />;
}