
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SimpleResultsDisplayProps {
  results: {
    rack: {
      powerDensity: number;
      coolingType: string;
      totalRacks: number;
    };
    power: {
      totalITLoad: number;
    };
    cost: {
      equipmentTotal: number;
      installation: number;
      engineering: number;
      totalProjectCost: number;
    };
  };
}

export function SimpleResultsDisplay({ results }: SimpleResultsDisplayProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Map cooling type codes to display names
  const getCoolingTypeDisplay = (type: string) => {
    switch (type) {
      case "dlc":
        return "Direct Liquid Cooling (DLC)";
      case "air":
        return "Air-cooled";
      case "hybrid":
        return "Hybrid Cooling";
      case "immersion":
        return "Immersion Cooling";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6 mt-8">
      <Tabs defaultValue="costSummary">
        <TabsList>
          <TabsTrigger value="costSummary">Cost Summary</TabsTrigger>
          <TabsTrigger value="detailedBreakdown">Detailed Breakdown</TabsTrigger>
          <TabsTrigger value="costChart">Cost Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="costSummary">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Power Density:</p>
                    <p className="text-lg font-semibold">{results.rack.powerDensity} kW/rack</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cooling Type:</p>
                    <p className="text-lg font-semibold">{getCoolingTypeDisplay(results.rack.coolingType)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Racks:</p>
                    <p className="text-lg font-semibold">{results.rack.totalRacks}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total IT Load:</p>
                    <p className="text-lg font-semibold">{results.power.totalITLoad} kW</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Cost Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Equipment Subtotal:</span>
                      <span className="font-medium">{formatCurrency(results.cost.equipmentTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Installation & Commissioning:</span>
                      <span className="font-medium">{formatCurrency(results.cost.installation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Engineering & Project Management:</span>
                      <span className="font-medium">{formatCurrency(results.cost.engineering)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t mt-2">
                      <span className="text-lg font-bold">Total Estimated Cost:</span>
                      <span className="text-lg font-bold">{formatCurrency(results.cost.totalProjectCost)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailedBreakdown">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Select the Cost Summary tab to view the main cost breakdown.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costChart">
          <Card>
            <CardHeader>
              <CardTitle>Cost Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Cost visualization chart will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
