
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calculator } from "lucide-react";

interface MatrixCalculatorSettingsProps {
  userId: string;
}

export function MatrixCalculatorSettings({ userId }: MatrixCalculatorSettingsProps) {
  const { toast } = useToast();
  const [calculationMethod, setCalculationMethod] = useState("standard");
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [showWarnings, setShowWarnings] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    
    // Simulate saving settings
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Settings saved",
      description: "Your matrix calculator settings have been updated successfully.",
    });
    
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Matrix Calculator Settings
          </CardTitle>
          <CardDescription>Configure matrix calculation preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="calculationMethod">Calculation Method</Label>
                <p className="text-sm text-muted-foreground">
                  Select the algorithm used for calculations
                </p>
              </div>
              <Select value={calculationMethod} onValueChange={setCalculationMethod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="precise">High Precision</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoCalculate">Auto Calculate</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically recalculate when values change
                </p>
              </div>
              <Switch
                id="autoCalculate"
                checked={autoCalculate}
                onCheckedChange={setAutoCalculate}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showWarnings">Show Warnings</Label>
                <p className="text-sm text-muted-foreground">
                  Display warnings for potential issues
                </p>
              </div>
              <Switch
                id="showWarnings"
                checked={showWarnings}
                onCheckedChange={setShowWarnings}
              />
            </div>
          </div>

          <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <Calculator className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Coming Soon</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    The Matrix Calculator is currently under development. These settings will be active once the feature is released.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSaveSettings} 
            disabled={saving || true}
            className="w-full md:w-auto"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
