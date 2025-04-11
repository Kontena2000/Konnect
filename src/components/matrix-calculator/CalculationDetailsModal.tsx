
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
          <ScrollArea className='flex-1 pr-4'>
            <div className='space-y-6 p-2'>
              {/* Configuration Summary Section */}
              <div className='bg-gray-50 p-4 rounded-lg border'>
                <h3 className='text-lg font-medium mb-3'>Configuration Summary</h3>
                <p className='text-base'>
                  {calculation.kwPerRack || 0}kW per rack, {' '}
                  {calculation.coolingType === 'dlc' ? 'Direct Liquid Cooling' : 
                   calculation.coolingType === 'air' ? 'Air Cooling' : 
                   calculation.coolingType === 'hybrid' ? 'Hybrid Cooling' : 'Immersion Cooling'}, {' '}
                  {calculation.totalRacks || 0} racks
                </p>
              </div>

              {/* Main Metrics Grid */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* Total Project Cost */}
                <div className='bg-gray-50 p-4 rounded-lg border'>
                  <h3 className='text-lg font-medium mb-2'>Total Project Cost</h3>
                  <p className='text-2xl font-bold text-amber-500'>
                    ${formatNumber(calculation.results?.cost?.totalProjectCost)}
                  </p>
                  {calculation.totalRacks > 0 && (
                    <p className='text-sm text-gray-600'>
                      ${formatNumber(Math.round((calculation.results?.cost?.totalProjectCost || 0) / calculation.totalRacks))} per rack
                    </p>
                  )}
                  {calculation.results?.cost?.costPerKw && (
                    <p className='text-sm text-gray-600'>
                      ${formatNumber(calculation.results.cost.costPerKw)} per kW
                    </p>
                  )}
                </div>

                {/* Power Requirements */}
                <div className='bg-gray-50 p-4 rounded-lg border'>
                  <h3 className='text-lg font-medium mb-2'>Power Requirements</h3>
                  <p className='text-2xl font-bold text-amber-500'>
                    {formatNumber(calculation.results?.power?.upsCapacity)} kW UPS Capacity
                  </p>
                  {calculation.results?.power?.upsModules && calculation.results?.power?.upsModuleSize && (
                    <p className='text-sm text-gray-600'>
                      {calculation.results.power.upsModules} x {calculation.results.power.upsModuleSize}kW UPS Modules
                    </p>
                  )}
                  {calculation.results?.power?.redundancy && (
                    <p className='text-sm text-gray-600'>
                      {calculation.results.power.redundancy} Redundancy
                    </p>
                  )}
                </div>

                {/* Cooling Solution */}
                <div className='bg-gray-50 p-4 rounded-lg border'>
                  <h3 className='text-lg font-medium mb-2'>Cooling Solution</h3>
                  <p className='text-2xl font-bold text-amber-500'>
                    {calculation.coolingType === 'hybrid' ? (
                      <>
                        {formatNumber(calculation.results?.cooling?.dlcCapacity)} kW DLC + {formatNumber(calculation.results?.cooling?.airCapacity)} kW Air
                      </>
                    ) : (
                      <>
                        {formatNumber(calculation.results?.cooling?.coolingCapacity || calculation.results?.cooling?.totalCapacity)} kW
                      </>
                    )}
                  </p>
                  {calculation.results?.cooling?.flowRate && (
                    <p className='text-sm text-gray-600'>
                      {formatNumber(calculation.results.cooling.flowRate, 2)} L/min Flow Rate
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
                          {renderDataRow('Current per Row:', '47150 A')}
                          {renderDataRow('Busbar Size:', 'busbar800A')}
                          {renderDataRow('Current per Rack:', '120 A')}
                        </div>
                      </div>

                      <div>
                        <h4 className='font-medium mb-2'>Rack PDUs</h4>
                        <div className='space-y-2'>
                          {renderDataRow('Type:', 'standard16 A')}
                          {renderDataRow('Quantity:', calculation.totalRacks || '28')}
                        </div>
                      </div>
                    </div>

                    <div className='mt-4'>
                      <h4 className='font-medium mb-2'>Tap-Off Boxes</h4>
                      <div className='space-y-2'>
                        {renderDataRow('Type:', 'standard63 A')}
                        {renderDataRow('Quantity:', '28')}
                      </div>
                    </div>

                    <div className='mt-4'>
                      <h4 className='font-medium mb-2'>Costs</h4>
                      <div className='space-y-2'>
                        {renderDataRow('Busbars:', '$5,484,706')}
                        {renderDataRow('Tap-Off Boxes:', '$5,484,706')}
                        {renderDataRow('Rack PDUs:', '$5,484,706')}
                        {renderDataRow('Total Electrical:', '$16,454,118')}
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
                          {renderDataRow('Cooling Type:', calculation.coolingType === 'dlc' ? 'Direct Liquid Cooling' : 
                            calculation.coolingType === 'air' ? 'Air Cooling' : 
                            calculation.coolingType === 'hybrid' ? 'Hybrid Cooling' : 'Immersion Cooling')}
                          {renderDataRow('Heat Rejection:', calculation.results?.cooling?.heatRejection ? 
                            `${formatNumber(calculation.results.cooling.heatRejection)} kW` : 'N/A')}
                          {renderDataRow('Water Usage:', calculation.results?.cooling?.waterUsage ? 
                            `${formatNumber(calculation.results.cooling.waterUsage)} m³/year` : 'N/A')}
                        </div>
                      </div>

                      <div>
                        <h4 className='font-medium mb-2'>Performance</h4>
                        <div className='space-y-2'>
                          {renderDataRow('Cooling Power:', calculation.results?.cooling?.coolingPower ? 
                            `${formatNumber(calculation.results.cooling.coolingPower)} kW` : 'N/A')}
                          {renderDataRow('Flow Rate:', '393.75 L/min')}
                          {renderDataRow('Efficiency:', calculation.results?.cooling?.efficiency ? 
                            formatPercentage(calculation.results.cooling.efficiency) : 'N/A')}
                        </div>
                      </div>
                    </div>

                    {calculation.results?.cooling?.breakdown && (
                      <div className='mt-4'>
                        <h4 className='font-medium mb-2'>Cooling Breakdown</h4>
                        <div className='space-y-2'>
                          {Object.entries(calculation.results.cooling.breakdown || {}).map(([key, value]: [string, any]) => (
                            <div key={key} className='grid grid-cols-2 py-2 border-b border-border/40 last:border-0'>
                              <span className='text-muted-foreground'>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                              <span className='font-medium'>{formatNumber(value)} kW</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className='mt-4'>
                      <h4 className='font-medium mb-2'>Costs</h4>
                      <div className='space-y-2'>
                        {renderDataRow('Equipment Cost:', formatCurrency(calculation.results?.cost?.breakdown?.coolingEquipment))}
                        {renderDataRow('Installation Cost:', formatCurrency(calculation.results?.cost?.breakdown?.coolingInstallation))}
                        {renderDataRow('Annual Operating Cost:', formatCurrency(calculation.results?.cost?.breakdown?.annualCoolingCost))}
                        {renderDataRow('Total Cooling Cost:', formatCurrency(calculation.results?.cost?.totalCoolingCost))}
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
                          {renderDataRow('UPS Capacity:', '2520 kW')}
                          {renderDataRow('UPS Modules:', '11 x 250kW')}
                          {renderDataRow('Redundancy:', 'N+1')}
                        </div>
                      </div>

                      <div>
                        <h4 className='font-medium mb-2'>Power Metrics</h4>
                        <div className='space-y-2'>
                          {renderDataRow('IT Load:', calculation.results?.power?.itLoad ? 
                            `${formatNumber(calculation.results.power.itLoad)} kW` : 'N/A')}
                          {renderDataRow('PUE:', calculation.results?.power?.pue ? 
                            formatNumber(calculation.results.power.pue, 3) : 'N/A')}
                          {renderDataRow('Annual Energy:', calculation.results?.power?.annualEnergy ? 
                            `${formatNumber(calculation.results.power.annualEnergy)} MWh` : 'N/A')}
                        </div>
                      </div>
                    </div>

                    {calculation.results?.power?.breakdown && (
                      <div className='mt-4'>
                        <h4 className='font-medium mb-2'>Power Breakdown</h4>
                        <div className='space-y-2'>
                          {Object.entries(calculation.results.power.breakdown || {}).map(([key, value]: [string, any]) => (
                            <div key={key} className='grid grid-cols-2 py-2 border-b border-border/40 last:border-0'>
                              <span className='text-muted-foreground'>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                              <span className='font-medium'>{formatNumber(value)} kW</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className='mt-4'>
                      <h4 className='font-medium mb-2'>Costs</h4>
                      <div className='space-y-2'>
                        {renderDataRow('UPS Cost:', formatCurrency(calculation.results?.cost?.breakdown?.ups))}
                        {renderDataRow('Generators Cost:', formatCurrency(calculation.results?.cost?.breakdown?.generators))}
                        {renderDataRow('Annual Energy Cost:', formatCurrency(calculation.results?.power?.annualEnergyCost))}
                        {renderDataRow('Total Power Cost:', formatCurrency(calculation.results?.cost?.totalPowerCost))}
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
                        <h4 className='font-medium mb-2'>Capital Expenditure</h4>
                        <div className='space-y-2'>
                          {renderDataRow('Power Infrastructure:', formatCurrency(calculation.results?.cost?.totalPowerCost))}
                          {renderDataRow('Cooling Infrastructure:', formatCurrency(calculation.results?.cost?.totalCoolingCost))}
                          {renderDataRow('Racks & Enclosures:', formatCurrency(calculation.results?.cost?.breakdown?.racks))}
                          {renderDataRow('Building & Construction:', formatCurrency(calculation.results?.cost?.breakdown?.building))}
                        </div>
                      </div>

                      <div>
                        <h4 className='font-medium mb-2'>Operating Expenditure</h4>
                        <div className='space-y-2'>
                          {renderDataRow('Annual Energy Cost:', formatCurrency(calculation.results?.power?.annualEnergyCost))}
                          {renderDataRow('Annual Cooling Cost:', formatCurrency(calculation.results?.cost?.breakdown?.annualCoolingCost))}
                          {renderDataRow('Annual Maintenance:', formatCurrency(calculation.results?.cost?.breakdown?.annualMaintenance))}
                          {renderDataRow('Total Annual OpEx:', formatCurrency(
                            (calculation.results?.power?.annualEnergyCost || 0) + 
                            (calculation.results?.cost?.breakdown?.annualCoolingCost || 0) + 
                            (calculation.results?.cost?.breakdown?.annualMaintenance || 0)
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className='mt-4'>
                      <h4 className='font-medium mb-2'>Total Project Costs</h4>
                      <div className='space-y-2'>
                        {renderDataRow('Total Infrastructure Cost:', formatCurrency(calculation.results?.cost?.totalInfrastructureCost))}
                        {renderDataRow('Cost per Rack:', '$1,958,824')}
                        {renderDataRow('Cost per kW:', '$10,000')}
                        {renderDataRow('Total Project Cost:', '$54,847,059')}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        ) : (
          <div className='flex flex-col items-center justify-center py-12'>
            <p className='text-muted-foreground'>Calculation not found or failed to load.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
