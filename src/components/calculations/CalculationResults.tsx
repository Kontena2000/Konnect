
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PowerCalculationResult, CoolingCalculationResult, EconomicCalculationResult } from "@/services/calculations/types";
import { AlertTriangle, CheckCircle, BatteryCharging, Thermometer, DollarSign } from "lucide-react";

interface CalculationResultsProps {
  power?: PowerCalculationResult;
  cooling?: CoolingCalculationResult;
  economic?: EconomicCalculationResult;
}

export function CalculationResults({ power, cooling, economic }: CalculationResultsProps) {
  return (
    <div className="space-y-6">
      {/* Power Calculations */}
      {power && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BatteryCharging className="h-5 w-5 text-yellow-500" />
              <CardTitle>Power Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Fault Current</p>
                <p className="text-2xl font-bold">{power.faultCurrent.toFixed(2)} A</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Voltage Drop</p>
                <p className="text-2xl font-bold">{(power.voltageDrop * 100).toFixed(2)}%</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Power Factor</p>
                <p className="text-2xl font-bold">{power.correctedPowerFactor.toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Required Feeder Size</p>
                <p className="text-2xl font-bold">{power.requiredFeederSize.toFixed(2)} A</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Circuit Breakers</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {power.breakers.map((breaker, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">Rating: {breaker.rating.toFixed(2)} A</p>
                    <p className="text-sm">Trip Time: {breaker.tripTime}s</p>
                    <Badge variant={breaker.coordination ? "default" : "destructive"}>
                      {breaker.coordination ? "Coordinated" : "Not Coordinated"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cooling Calculations */}
      {cooling && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-blue-500" />
              <CardTitle>Cooling Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Required Capacity</p>
                <p className="text-2xl font-bold">{cooling.requiredCapacity.toFixed(2)} kW</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Airflow</p>
                <p className="text-2xl font-bold">{cooling.airflow.toFixed(2)} CFM</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Chilled Water Flow</p>
                <p className="text-2xl font-bold">{cooling.chilledWaterFlow.toFixed(2)} GPM</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Heat Rejection</p>
                <p className="text-2xl font-bold">{cooling.heatRejection.toFixed(2)} kW</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Psychrometric Analysis</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">Dew Point</p>
                  <p className="text-lg font-semibold">{cooling.psychrometrics.dewPoint.toFixed(1)}°C</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">Absolute Humidity</p>
                  <p className="text-lg font-semibold">{cooling.psychrometrics.absoluteHumidity.toFixed(2)} g/kg</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">Enthalpy</p>
                  <p className="text-lg font-semibold">{cooling.psychrometrics.enthalpy.toFixed(1)} kJ/kg</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Redundancy Analysis</p>
              <div className="flex gap-2">
                <Badge variant={cooling.redundancyAnalysis.n ? "default" : "secondary"}>N</Badge>
                <Badge variant={cooling.redundancyAnalysis.nPlusOne ? "default" : "secondary"}>N+1</Badge>
                <Badge variant={cooling.redundancyAnalysis.twoN ? "default" : "secondary"}>2N</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Economic Calculations */}
      {economic && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <CardTitle>Economic Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Total Cost of Ownership</p>
                <p className="text-2xl font-bold">${economic.totalCostOfOwnership.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">PUE</p>
                <p className="text-2xl font-bold">{economic.powerUsageEffectiveness.toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Annual Energy Cost</p>
                <p className="text-2xl font-bold">${economic.annualEnergyCost.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Carbon Footprint</p>
                <p className="text-2xl font-bold">{economic.carbonFootprint.toFixed(1)} tCO₂e</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">ROI Analysis</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">Payback Period</p>
                  <p className="text-lg font-semibold">{economic.roi.paybackPeriod.toFixed(1)} years</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">NPV</p>
                  <p className="text-lg font-semibold">${economic.roi.npv.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">IRR</p>
                  <p className="text-lg font-semibold">{(economic.roi.irr * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Cost Breakdown</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">CAPEX</p>
                  <p className="text-lg font-semibold">${economic.costBreakdown.capex.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">OPEX</p>
                  <p className="text-lg font-semibold">${economic.costBreakdown.opex.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">Maintenance</p>
                  <p className="text-lg font-semibold">${economic.costBreakdown.maintenance.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">Energy</p>
                  <p className="text-lg font-semibold">${economic.costBreakdown.energy.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
