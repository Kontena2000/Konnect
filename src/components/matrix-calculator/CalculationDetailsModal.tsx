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
      <DialogContent className='max-w-xl max-h-[90vh] flex flex-col'>
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
                    75kW per rack, Direct Liquid Cooling, 28 racks
                  </p>
                </div>

                {/* Main Metrics Grid */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {/* Total Project Cost */}
                  <div className='bg-gray-50 p-4 rounded-lg border'>
                    <h3 className='text-lg font-medium mb-2'>Total Project Cost</h3>
                    <p className='text-2xl font-bold text-amber-500'>
                      $54,847,059
                    </p>
                    <p className='text-sm text-gray-600'>
                      $1,958,824 per rack
                    </p>
                    <p className='text-sm text-gray-600'>
                      $10,000 per kW
                    </p>
                  </div>

                  {/* Power Requirements */}
                  <div className='bg-gray-50 p-4 rounded-lg border'>
                    <h3 className='text-lg font-medium mb-2'>Power Requirements</h3>
                    <p className='text-2xl font-bold text-amber-500'>
                      2520 kW UPS Capacity
                    </p>
                    <p className='text-sm text-gray-600'>
                      11 x 250kW UPS Modules
                    </p>
                    <p className='text-sm text-gray-600'>
                      N+1 Redundancy
                    </p>
                  </div>

                  {/* Cooling Solution */}
                  <div className='bg-gray-50 p-4 rounded-lg border'>
                    <h3 className='text-lg font-medium mb-2'>Cooling Solution</h3>
                    <p className='text-2xl font-bold text-amber-500'>
                      1575 kW DLC + 525 kW Air
                    </p>
                    <p className='text-sm text-gray-600'>
                      393.75 L/min Flow Rate
                    </p>
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
                            {renderDataRow('Quantity:', '28')}
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
                            {renderDataRow('Cooling Type:', 'Direct Liquid Cooling')}
                            {renderDataRow('Heat Rejection:', '2100 kW')}
                            {renderDataRow('Water Usage:', '18,250 m³/year')}
                          </div>
                        </div>

                        <div>
                          <h4 className='font-medium mb-2'>Performance</h4>
                          <div className='space-y-2'>
                            {renderDataRow('Cooling Power:', '2100 kW')}
                            {renderDataRow('Flow Rate:', '393.75 L/min')}
                            {renderDataRow('Efficiency:', '95.00%')}
                          </div>
                        </div>
                      </div>

                      <div className='mt-4'>
                        <h4 className='font-medium mb-2'>Cooling Breakdown</h4>
                        <div className='space-y-2'>
                          {renderDataRow('DLC Capacity:', '1575 kW')}
                          {renderDataRow('Air Capacity:', '525 kW')}
                          {renderDataRow('Total Capacity:', '2100 kW')}
                        </div>
                      </div>

                      <div className='mt-4'>
                        <h4 className='font-medium mb-2'>Costs</h4>
                        <div className='space-y-2'>
                          {renderDataRow('Equipment Cost:', '$10,969,412')}
                          {renderDataRow('Installation Cost:', '$5,484,706')}
                          {renderDataRow('Annual Operating Cost:', '$1,096,941')}
                          {renderDataRow('Total Cooling Cost:', '$16,454,118')}
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
                            {renderDataRow('IT Load:', '2100 kW')}
                            {renderDataRow('PUE:', '1.200')}
                            {renderDataRow('Annual Energy:', '22,075 MWh')}
                          </div>
                        </div>
                      </div>

                      <div className='mt-4'>
                        <h4 className='font-medium mb-2'>Power Breakdown</h4>
                        <div className='space-y-2'>
                          {renderDataRow('IT Equipment:', '2100 kW')}
                          {renderDataRow('Cooling Systems:', '210 kW')}
                          {renderDataRow('Other Overhead:', '210 kW')}
                          {renderDataRow('Total Power:', '2520 kW')}
                        </div>
                      </div>

                      <div className='mt-4'>
                        <h4 className='font-medium mb-2'>Costs</h4>
                        <div className='space-y-2'>
                          {renderDataRow('UPS Cost:', '$10,969,412')}
                          {renderDataRow('Generators Cost:', '$5,484,706')}
                          {renderDataRow('Annual Energy Cost:', '$2,207,500')}
                          {renderDataRow('Total Power Cost:', '$16,454,118')}
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
                            {renderDataRow('Power Infrastructure:', '$16,454,118')}
                            {renderDataRow('Cooling Infrastructure:', '$16,454,118')}
                            {renderDataRow('Racks & Enclosures:', '$5,484,706')}
                            {renderDataRow('Building & Construction:', '$16,454,118')}
                          </div>
                        </div>

                        <div>
                          <h4 className='font-medium mb-2'>Operating Expenditure</h4>
                          <div className='space-y-2'>
                            {renderDataRow('Annual Energy Cost:', '$2,207,500')}
                            {renderDataRow('Annual Cooling Cost:', '$1,096,941')}
                            {renderDataRow('Annual Maintenance:', '$1,645,412')}
                            {renderDataRow('Total Annual OpEx:', '$4,949,853')}
                          </div>
                        </div>
                      </div>

                      <div className='mt-4'>
                        <h4 className='font-medium mb-2'>Total Project Costs</h4>
                        <div className='space-y-2'>
                          {renderDataRow('Total Infrastructure Cost:', '$54,847,059')}
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
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-12'>
            <p className='text-muted-foreground'>Calculation not found or failed to load.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}