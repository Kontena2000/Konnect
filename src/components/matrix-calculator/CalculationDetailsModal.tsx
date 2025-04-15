import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getFirestoreSafely } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Loader2, X } from "lucide-react";
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
    if (!timestamp) return 'Unknown';
    try {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format number with commas and decimal places
  const formatNumber = (num: number | undefined | null, decimals = 0) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Format currency
  const formatCurrency = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '$0';
    return `$${formatNumber(num, 0)}`;
  };

  // Format percentage
  const formatPercentage = (num: number | undefined | null) => {
    if (num === undefined || num === null) return "0%";
    return `${formatNumber(num * 100, 2)}%`;
  };

  // Render a data row with label and value
  const renderDataRow = (label: string, value: React.ReactNode) => (
    <div className='grid grid-cols-2 py-2 border-b border-border/40 last:border-0'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='font-medium'>{value}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] flex flex-col'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle className='text-xl'>
              {loading ? 'Loading Calculation Details...' : calculation?.name || 'Calculation Details'}
            </DialogTitle>
            <DialogClose asChild>
              <Button variant='ghost' size='icon'>
                <X className='h-4 w-4' />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription>
            {!loading && calculation?.description}
            {!loading && (
              <div className='flex gap-2 mt-1 text-xs'>
                <span className='text-muted-foreground'>Created: {formatDate(calculation?.createdAt)}</span>
                {calculation?.updatedAt && (
                  <span className='text-muted-foreground'>• Updated: {formatDate(calculation?.updatedAt)}</span>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        ) : calculation ? (
          <div className='flex-1 overflow-hidden'>
            <ScrollArea className='h-[calc(80vh-120px)] pr-4'>
              <div className='space-y-6 p-2'>
                {/* Configuration Summary Section */}
                <div className='bg-gray-50 p-4 rounded-lg border'>
                  <h3 className='text-lg font-medium mb-3'>Configuration Summary</h3>
                  <p className='text-base'>
                    {calculation.kwPerRack}kW per rack, {calculation.coolingType === 'dlc' ? 'Direct Liquid Cooling' : calculation.coolingType === 'air' ? 'Air Cooling' : calculation.coolingType === 'hybrid' ? 'Hybrid Cooling' : 'Immersion Cooling'}, {calculation.totalRacks} racks
                  </p>
                </div>

                {/* Main Metrics Grid */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {/* Total Project Cost */}
                  <div className='bg-gray-50 p-4 rounded-lg border'>
                    <h3 className='text-lg font-medium mb-2'>Total Project Cost</h3>
                    <p className='text-2xl font-bold text-amber-500'>
                      {formatCurrency(calculation.results?.cost?.totalProjectCost)}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {formatCurrency(calculation.results?.cost?.costPerRack)} per rack
                    </p>
                    <p className='text-sm text-gray-600'>
                      {formatCurrency(calculation.results?.cost?.costPerKw)} per kW
                    </p>
                  </div>

                  {/* Power Requirements */}
                  <div className='bg-gray-50 p-4 rounded-lg border'>
                    <h3 className='text-lg font-medium mb-2'>Power Requirements</h3>
                    <p className='text-2xl font-bold text-amber-500'>
                      {formatNumber(calculation.results?.power?.ups?.requiredCapacity)} kW UPS Capacity
                    </p>
                    <p className='text-sm text-gray-600'>
                      {calculation.results?.power?.ups?.totalModulesNeeded} x {calculation.results?.power?.ups?.moduleSize}kW UPS Modules
                    </p>
                    <p className='text-sm text-gray-600'>
                      {calculation.redundancyMode || 'N+1'} Redundancy
                    </p>
                  </div>

                  {/* Cooling Solution */}
                  <div className='bg-gray-50 p-4 rounded-lg border'>
                    <h3 className='text-lg font-medium mb-2'>Cooling Solution</h3>
                    <p className='text-2xl font-bold text-amber-500'>
                      {formatNumber(calculation.results?.cooling?.totalCapacity)} kW Total
                    </p>
                    {calculation.results?.cooling?.dlcCoolingCapacity && (
                      <p className='text-sm text-gray-600'>
                        {formatNumber(calculation.results?.cooling?.dlcCoolingCapacity)} kW DLC
                      </p>
                    )}
                    {calculation.results?.cooling?.residualCoolingCapacity && (
                      <p className='text-sm text-gray-600'>
                        {formatNumber(calculation.results?.cooling?.residualCoolingCapacity)} kW Air
                      </p>
                    )}
                  </div>
                </div>

                {/* Tabs for Detailed Information */}
                <Tabs defaultValue='electrical' className='w-full mt-6'>
                  <TabsList className='mb-4 w-full justify-start'>
                    <TabsTrigger value='electrical'>Electrical</TabsTrigger>
                    <TabsTrigger value='cooling'>Cooling</TabsTrigger>
                    <TabsTrigger value='power-systems'>Power Systems</TabsTrigger>
                    <TabsTrigger value='cost-breakdown'>Cost Breakdown</TabsTrigger>
                  </TabsList>

                  {/* Electrical System Details */}
                  <TabsContent value='electrical' className='space-y-6'>
                    <div className='bg-gray-50 p-4 rounded-lg border'>
                      <h3 className='text-lg font-medium mb-3'>Electrical System Details</h3>
                      
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-4'>
                        <div>
                          <h4 className='font-medium mb-2'>Power Distribution</h4>
                          <div className='space-y-2'>
                            {renderDataRow('Current per Row:', `${formatNumber(calculation.results?.electrical?.currentPerRow)} A`)}
                            {renderDataRow('Busbar Size:', calculation.results?.electrical?.busbarSize)}
                            {renderDataRow('Current per Rack:', `${formatNumber(calculation.results?.electrical?.currentPerRack)} A`)}
                            {calculation.results?.electrical?.multiplicityWarning && (
                              <div className='text-yellow-600 text-sm mt-2'>
                                {calculation.results.electrical.multiplicityWarning}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className='font-medium mb-2'>Rack PDUs</h4>
                          <div className='space-y-2'>
                            {renderDataRow('Type:', calculation.results?.electrical?.rpdu)}
                            {renderDataRow('Quantity:', calculation.totalRacks)}
                          </div>
                        </div>
                      </div>

                      <div className='mt-4'>
                        <h4 className='font-medium mb-2'>Tap-Off Boxes</h4>
                        <div className='space-y-2'>
                          {renderDataRow('Type:', calculation.results?.electrical?.tapOffBox)}
                          {renderDataRow('Quantity:', calculation.totalRacks)}
                        </div>
                      </div>

                      <div className='mt-4'>
                        <h4 className='font-medium mb-2'>Costs</h4>
                        <div className='space-y-2'>
                          {renderDataRow('Busbars:', formatCurrency(calculation.results?.cost?.electrical?.busbar))}
                          {renderDataRow('Tap-Off Boxes:', formatCurrency(calculation.results?.cost?.electrical?.tapOffBox))}
                          {renderDataRow('Rack PDUs:', formatCurrency(calculation.results?.cost?.electrical?.rpdu))}
                          {renderDataRow('Total Electrical:', formatCurrency(calculation.results?.cost?.electrical?.total))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Cooling Tab */}
                  <TabsContent value='cooling' className='space-y-6'>
                    <div className='bg-gray-50 p-4 rounded-lg border'>
                      <h3 className='text-lg font-medium mb-3'>Cooling System Details</h3>
                      
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-4'>
                        <div>
                          <h4 className='font-medium mb-2'>System Specifications</h4>
                          <div className='space-y-2'>
                            {renderDataRow('Cooling Type:', calculation.coolingType === 'dlc' ? 'Direct Liquid Cooling' : calculation.coolingType === 'air' ? 'Air Cooling' : calculation.coolingType === 'hybrid' ? 'Hybrid Cooling' : 'Immersion Cooling')}
                            {renderDataRow('Total Capacity:', `${formatNumber(calculation.results?.cooling?.totalCapacity)} kW`)}
                            {renderDataRow('PUE:', formatNumber(calculation.results?.cooling?.pue, 3))}
                            {calculation.results?.cooling?.pipingSize && (
                              renderDataRow('Piping Size:', calculation.results.cooling.pipingSize)
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className='font-medium mb-2'>Performance</h4>
                          <div className='space-y-2'>
                            {renderDataRow('Cooling Power:', `${formatNumber(calculation.results?.cooling?.totalCapacity)} kW`)}
                            {calculation.results?.cooling?.dlcFlowRate && (
                              renderDataRow('Flow Rate:', `${formatNumber(calculation.results.cooling.dlcFlowRate)} L/min`)
                            )}
                          </div>
                        </div>
                      </div>

                      <div className='mt-4'>
                        <h4 className='font-medium mb-2'>Cooling Breakdown</h4>
                        <div className='space-y-2'>
                          {calculation.results?.cooling?.dlcCoolingCapacity && (
                            renderDataRow('DLC Capacity:', `${formatNumber(calculation.results?.cooling?.dlcCoolingCapacity)} kW`)
                          )}
                          {calculation.results?.cooling?.residualCoolingCapacity && (
                            renderDataRow('Air Capacity:', `${formatNumber(calculation.results?.cooling?.residualCoolingCapacity)} kW`)
                          )}
                          {renderDataRow('Total Capacity:', `${formatNumber(calculation.results?.cooling?.totalCapacity)} kW`)}
                        </div>
                      </div>

                      <div className='mt-4'>
                        <h4 className='font-medium mb-2'>Cooler Details</h4>
                        <div className='space-y-2'>
                          {calculation.coolingType === 'dlc' && (
                            <>
                              {renderDataRow('Cooler Model:', 'TCS310A-XHT')}
                              {renderDataRow('Pump Model:', 'Grundfos')}
                              {renderDataRow('Buffer Tank:', 'Standard')}
                            </>
                          )}
                          {calculation.coolingType === 'hybrid' && (
                            <>
                              {renderDataRow('DLC Cooler Model:', 'TCS310A-XHT')}
                              {renderDataRow('Pump Model:', 'Grundfos')}
                              {renderDataRow('Buffer Tank:', 'Standard')}
                              {renderDataRow('RDHX Model:', calculation.results?.cooling?.rdhxModel || 'Standard')}
                              {renderDataRow('RDHX Units:', calculation.results?.cooling?.rdhxUnits || 1)}
                            </>
                          )}
                          {calculation.coolingType === 'air' && (
                            <>
                              {renderDataRow('RDHX Model:', calculation.results?.cooling?.rdhxModel || 'Standard')}
                              {renderDataRow('RDHX Units:', calculation.results?.cooling?.rdhxUnits || 1)}
                            </>
                          )}
                          {calculation.coolingType === 'immersion' && (
                            <>
                              {renderDataRow('Tank Model:', 'Immersion Tank')}
                              {renderDataRow('CDU Model:', 'Immersion CDU')}
                              {renderDataRow('Tanks Needed:', calculation.results?.cooling?.tanksNeeded || 1)}
                            </>
                          )}
                        </div>
                      </div>

                      <div className='mt-4'>
                        <h4 className='font-medium mb-2'>Costs</h4>
                        <div className='space-y-2'>
                          {renderDataRow('Total Cooling:', formatCurrency(calculation.results?.cost?.cooling))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Power Systems Tab */}
                  <TabsContent value='power-systems' className='space-y-6'>
                    <div className='bg-gray-50 p-4 rounded-lg border'>
                      <h3 className='text-lg font-medium mb-3'>Power Systems Details</h3>
                      
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-4'>
                        <div>
                          <h4 className='font-medium mb-2'>UPS System</h4>
                          <div className='space-y-2'>
                            {renderDataRow('UPS Capacity:', `${formatNumber(calculation.results?.power?.ups?.requiredCapacity)} kW`)}
                            {renderDataRow('UPS Modules:', `${calculation.results?.power?.ups?.totalModulesNeeded} x ${calculation.results?.power?.ups?.moduleSize}kW`)}
                            {renderDataRow('Redundancy:', calculation.redundancyMode || 'N+1')}
                            {renderDataRow('Frames Needed:', calculation.results?.power?.ups?.framesNeeded)}
                            {renderDataRow('Frame Size:', calculation.results?.power?.ups?.frameSize)}
                          </div>
                        </div>

                        <div>
                          <h4 className='font-medium mb-2'>Battery System</h4>
                          <div className='space-y-2'>
                            {renderDataRow('Runtime:', `${calculation.results?.power?.battery?.runtime} minutes`)}
                            {renderDataRow('Energy Needed:', `${formatNumber(calculation.results?.power?.battery?.energyNeeded)} kWh`)}
                            {renderDataRow('Cabinets Needed:', calculation.results?.power?.battery?.cabinetsNeeded)}
                            {renderDataRow('Total Weight:', `${formatNumber(calculation.results?.power?.battery?.totalWeight)} kg`)}
                          </div>
                        </div>
                      </div>

                      {calculation.results?.power?.generator?.included && (
                        <div className='mt-4'>
                          <h4 className='font-medium mb-2'>Generator System</h4>
                          <div className='space-y-2'>
                            {renderDataRow('Capacity:', `${formatNumber(calculation.results?.power?.generator?.capacity)} kW`)}
                            {renderDataRow('Model:', calculation.results?.power?.generator?.model)}
                            {renderDataRow('Tank Size:', `${formatNumber(calculation.results?.power?.generator?.fuel?.tankSize)} L`)}
                            {renderDataRow('Consumption:', `${formatNumber(calculation.results?.power?.generator?.fuel?.consumption)} L/h`)}
                            {renderDataRow('Runtime:', `${formatNumber(calculation.results?.power?.generator?.fuel?.runtime)} h`)}
                          </div>
                        </div>
                      )}

                      <div className='mt-4'>
                        <h4 className='font-medium mb-2'>Costs</h4>
                        <div className='space-y-2'>
                          {renderDataRow('UPS System:', formatCurrency(calculation.results?.cost?.power?.ups))}
                          {renderDataRow('Battery System:', formatCurrency(calculation.results?.cost?.power?.battery))}
                          {calculation.results?.power?.generator?.included && (
                            renderDataRow('Generator System:', formatCurrency(calculation.results?.cost?.power?.generator))
                          )}
                          {renderDataRow('Total Power Systems:', formatCurrency(calculation.results?.cost?.power?.total))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Cost Breakdown Tab */}
                  <TabsContent value='cost-breakdown' className='space-y-6'>
                    <div className='bg-gray-50 p-4 rounded-lg border'>
                      <h3 className='text-lg font-medium mb-3'>Cost Breakdown</h3>
                      
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-4'>
                        <div>
                          <h4 className='font-medium mb-2'>Equipment Costs</h4>
                          <div className='space-y-2'>
                            {renderDataRow('Electrical Distribution:', formatCurrency(calculation.results?.cost?.electrical?.total))}
                            {renderDataRow('Cooling Systems:', formatCurrency(calculation.results?.cost?.cooling))}
                            {renderDataRow('Power Systems:', formatCurrency(calculation.results?.cost?.power?.total))}
                            {renderDataRow('Infrastructure:', formatCurrency(calculation.results?.cost?.infrastructure))}
                            {renderDataRow('Sustainability:', formatCurrency(calculation.results?.cost?.sustainability))}
                            {renderDataRow('Total Equipment:', formatCurrency(calculation.results?.cost?.equipmentTotal))}
                          </div>
                        </div>

                        <div>
                          <h4 className='font-medium mb-2'>Additional Costs</h4>
                          <div className='space-y-2'>
                            {renderDataRow('Installation:', formatCurrency(calculation.results?.cost?.installation))}
                            {renderDataRow('Engineering:', formatCurrency(calculation.results?.cost?.engineering))}
                            {renderDataRow('Contingency:', formatCurrency(calculation.results?.cost?.contingency))}
                          </div>
                        </div>
                      </div>

                      <div className='mt-4'>
                        <h4 className='font-medium mb-2'>Total Project Costs</h4>
                        <div className='space-y-2'>
                          {renderDataRow('Total Project Cost:', formatCurrency(calculation.results?.cost?.totalProjectCost))}
                          {renderDataRow('Cost per Rack:', formatCurrency(calculation.results?.cost?.costPerRack))}
                          {renderDataRow('Cost per kW:', formatCurrency(calculation.results?.cost?.costPerKw))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-12'>
            <p className='text-muted-foreground'>Calculation not found or failed to load.</p>
          </div>
        )}

        {/* Add Dialog Footer with Generate PDF button */}
        {!loading && calculation && (
          <DialogFooter className="mt-4">
            {/* Hapus tombol Generate PDF jika ada */}
            {/* <GeneratePdfButton calculation={calculation} /> */}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}