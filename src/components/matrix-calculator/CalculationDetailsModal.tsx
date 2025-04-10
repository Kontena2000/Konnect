
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getFirestoreSafely } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CalculationDetailsModalProps {
  calculationId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalculationDetailsModal({
  calculationId,
  isOpen,
  onOpenChange
}: CalculationDetailsModalProps) {
  const [calculation, setCalculation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCalculation = async () => {
      if (!calculationId || !isOpen) return;

      setLoading(true);
      try {
        const db = getFirestoreSafely();
        if (!db) {
          throw new Error("Firestore not available");
        }

        const docRef = doc(db, "matrix_calculator", "user_configurations", "configs", calculationId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCalculation(docSnap.data());
        } else {
          throw new Error("Calculation not found");
        }
      } catch (error) {
        console.error("Error fetching calculation:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load calculation details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCalculation();
  }, [calculationId, isOpen, toast]);

  // Format date from Firestore timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    try {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    } catch (e) {
      return "Invalid date";
    }
  };

  // Format number with commas and decimal places
  const formatNumber = (num: number, decimals = 2) => {
    if (num === undefined || num === null) return "N/A";
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Format currency
  const formatCurrency = (num: number) => {
    if (num === undefined || num === null) return "N/A";
    return `$${formatNumber(num, 2)}`;
  };

  // Format percentage
  const formatPercentage = (num: number) => {
    if (num === undefined || num === null) return "N/A";
    return `${formatNumber(num * 100, 2)}%`;
  };

  // Render a section with title and content
  const renderSection = (title: string, content: React.ReactNode) => (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <div className="bg-muted/20 p-4 rounded-md">{content}</div>
    </div>
  );

  // Render a data row with label and value
  const renderDataRow = (label: string, value: React.ReactNode) => (
    <div className="grid grid-cols-2 py-2 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {loading ? "Loading Calculation Details..." : calculation?.name || "Calculation Details"}
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription>
            {!loading && calculation?.description}
            {!loading && (
              <div className="flex gap-2 mt-1 text-xs">
                <span className="text-muted-foreground">Created: {formatDate(calculation?.createdAt)}</span>
                {calculation?.updatedAt && (
                  <span className="text-muted-foreground">• Updated: {formatDate(calculation?.updatedAt)}</span>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : calculation ? (
          <ScrollArea className="flex-1 pr-4">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="power">Power</TabsTrigger>
                <TabsTrigger value="cooling">Cooling</TabsTrigger>
                <TabsTrigger value="costs">Costs</TabsTrigger>
                <TabsTrigger value="all">All Data</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    <div className="space-y-2">
                      {renderDataRow("Project Name", calculation.projectName || "N/A")}
                      {renderDataRow("Total Racks", calculation.totalRacks || "N/A")}
                      {renderDataRow("Power Density", `${calculation.kwPerRack || "N/A"} kW/rack`)}
                      {renderDataRow("Cooling Type", calculation.coolingType === "dlc"
                        ? "Direct Liquid Cooling"
                        : calculation.coolingType === "air"
                        ? "Air Cooling"
                        : calculation.coolingType === "hybrid"
                        ? "Hybrid Cooling"
                        : "Immersion Cooling")}
                      {renderDataRow("Location", calculation.location?.name || "N/A")}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Summary Results</h3>
                    <div className="space-y-2">
                      {calculation.results?.cost && (
                        <>
                          {renderDataRow("Total Project Cost", formatCurrency(calculation.results.cost.totalProjectCost))}
                          {renderDataRow("Total Power Cost", formatCurrency(calculation.results.cost.totalPowerCost))}
                          {renderDataRow("Total Cooling Cost", formatCurrency(calculation.results.cost.totalCoolingCost))}
                          {renderDataRow("Total Infrastructure Cost", formatCurrency(calculation.results.cost.totalInfrastructureCost))}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {calculation.results?.summary && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Key Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-muted/20 p-4 rounded-md">
                        <div className="text-sm text-muted-foreground">Total Power</div>
                        <div className="text-2xl font-bold">{formatNumber(calculation.results.summary.totalPower)} kW</div>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-md">
                        <div className="text-sm text-muted-foreground">PUE</div>
                        <div className="text-2xl font-bold">{formatNumber(calculation.results.summary.pue, 3)}</div>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-md">
                        <div className="text-sm text-muted-foreground">Annual Energy</div>
                        <div className="text-2xl font-bold">{formatNumber(calculation.results.summary.annualEnergy)} MWh</div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="power" className="space-y-6">
                {calculation.results?.power && (
                  <>
                    {renderSection("Power Summary", (
                      <div className="space-y-2">
                        {renderDataRow("IT Load", `${formatNumber(calculation.results.power.itLoad)} kW`)}
                        {renderDataRow("Total Power", `${formatNumber(calculation.results.power.totalPower)} kW`)}
                        {renderDataRow("PUE", formatNumber(calculation.results.power.pue, 3))}
                        {renderDataRow("Annual Energy", `${formatNumber(calculation.results.power.annualEnergy)} MWh`)}
                        {renderDataRow("Annual Energy Cost", formatCurrency(calculation.results.power.annualEnergyCost))}
                      </div>
                    ))}

                    {calculation.results.power.breakdown && 
                      renderSection("Power Breakdown", (
                        <div className="space-y-2">
                          {Object.entries(calculation.results.power.breakdown).map(([key, value]: [string, any]) => (
                            <div key={key} className="grid grid-cols-2 py-2 border-b border-border/40 last:border-0">
                              <span className="text-muted-foreground">{key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}</span>
                              <span className="font-medium">{formatNumber(value)} kW</span>
                            </div>
                          ))}
                        </div>
                      ))
                    }
                  </>
                )}
              </TabsContent>

              <TabsContent value="cooling" className="space-y-6">
                {calculation.results?.cooling && (
                  <>
                    {renderSection("Cooling Summary", (
                      <div className="space-y-2">
                        {renderDataRow("Cooling Type", calculation.coolingType === "dlc"
                          ? "Direct Liquid Cooling"
                          : calculation.coolingType === "air"
                          ? "Air Cooling"
                          : calculation.coolingType === "hybrid"
                          ? "Hybrid Cooling"
                          : "Immersion Cooling")}
                        {renderDataRow("Heat Rejection", `${formatNumber(calculation.results.cooling.heatRejection)} kW`)}
                        {renderDataRow("Cooling Power", `${formatNumber(calculation.results.cooling.coolingPower)} kW`)}
                        {renderDataRow("Water Usage", `${formatNumber(calculation.results.cooling.waterUsage)} m³/year`)}
                      </div>
                    ))}

                    {calculation.results.cooling.breakdown && 
                      renderSection("Cooling Breakdown", (
                        <div className="space-y-2">
                          {Object.entries(calculation.results.cooling.breakdown).map(([key, value]: [string, any]) => (
                            <div key={key} className="grid grid-cols-2 py-2 border-b border-border/40 last:border-0">
                              <span className="text-muted-foreground">{key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}</span>
                              <span className="font-medium">{formatNumber(value)} kW</span>
                            </div>
                          ))}
                        </div>
                      ))
                    }
                  </>
                )}
              </TabsContent>

              <TabsContent value="costs" className="space-y-6">
                {calculation.results?.cost && (
                  <>
                    {renderSection("Cost Summary", (
                      <div className="space-y-2">
                        {renderDataRow("Total Project Cost", formatCurrency(calculation.results.cost.totalProjectCost))}
                        {renderDataRow("Total Power Cost", formatCurrency(calculation.results.cost.totalPowerCost))}
                        {renderDataRow("Total Cooling Cost", formatCurrency(calculation.results.cost.totalCoolingCost))}
                        {renderDataRow("Total Infrastructure Cost", formatCurrency(calculation.results.cost.totalInfrastructureCost))}
                      </div>
                    ))}

                    {calculation.results.cost.breakdown && 
                      renderSection("Cost Breakdown", (
                        <div className="space-y-2">
                          {Object.entries(calculation.results.cost.breakdown).map(([key, value]: [string, any]) => (
                            <div key={key} className="grid grid-cols-2 py-2 border-b border-border/40 last:border-0">
                              <span className="text-muted-foreground">{key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}</span>
                              <span className="font-medium">{formatCurrency(value)}</span>
                            </div>
                          ))}
                        </div>
                      ))
                    }
                  </>
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-6">
                <div className="bg-muted/20 p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-xs overflow-auto">
                    {JSON.stringify(calculation, null, 2)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Calculation not found or failed to load.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
