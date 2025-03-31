import { calculateCoolingCapacity } from '../calculatorUtils';
import { CalculationParams, CoolingParams } from '@/types/calculationParams';
import { CoolingResult } from './types';
import { DEFAULT_CALCULATION_PARAMS } from '@/constants/calculatorConstants';

/**
 * Calculate cooling requirements based on input parameters
 */
export function calculateCooling(
  kwPerRack: number, 
  coolingType: string, 
  totalRacks: number, 
  params: { cooling: CoolingParams }
): CoolingResult {
  const totalITLoad = kwPerRack * totalRacks;
  
  // Create a complete CalculationParams object with the provided cooling params
  const fullParams: CalculationParams = {
    ...DEFAULT_CALCULATION_PARAMS,
    cooling: params.cooling
  };
  
  // Get cooling capacity based on type
  const cooling = calculateCoolingCapacity(totalITLoad, coolingType, fullParams);
  
  // Add additional details based on cooling type
  switch (coolingType.toLowerCase()) {
    case 'dlc':
      return {
        type: 'dlc',
        totalCapacity: cooling.totalCapacity,
        dlcCoolingCapacity: cooling.dlcCoolingCapacity || 0,
        residualCoolingCapacity: cooling.residualCoolingCapacity || 0,
        dlcFlowRate: (cooling.dlcCoolingCapacity || 0) * params.cooling.flowRateFactor,
        pipingSize: (cooling.dlcCoolingCapacity || 0) > 1000 ? 'dn160' : 'dn110',
        pue: cooling.pueImpact
      };
      
    case 'hybrid':
      return {
        type: 'hybrid',
        totalCapacity: cooling.totalCapacity,
        dlcPortion: cooling.dlcPortion || 0,
        airPortion: cooling.airPortion || 0,
        dlcFlowRate: (cooling.dlcPortion || 0) * params.cooling.flowRateFactor,
        rdhxUnits: Math.ceil((cooling.airPortion || 0) / 150),
        rdhxModel: 'average',
        pipingSize: 'dn110',
        pue: cooling.pueImpact
      };
      
    case 'immersion':
      return {
        type: 'immersion',
        totalCapacity: cooling.totalCapacity,
        tanksNeeded: Math.ceil(totalRacks / 4),
        flowRate: cooling.totalCapacity * params.cooling.flowRateFactor * 0.8, // 80% of heat removed by fluid
        pipingSize: 'dn110', // Add pipingSize for immersion cooling
        pue: cooling.pueImpact
      };
      
    default: // air cooling
      const rdhxCapacity = 150; // kW per unit
      const rdhxUnits = Math.ceil(cooling.totalCapacity / rdhxCapacity);
      
      return {
        type: 'air',
        totalCapacity: cooling.totalCapacity,
        rdhxUnits,
        rdhxModel: kwPerRack <= 15 ? 'basic' : kwPerRack <= 30 ? 'standard' : 'highDensity',
        pipingSize: 'none', // Add default pipingSize for air cooling
        pue: cooling.pueImpact
      };
  }
}

/**
 * Calculate pipe sizing based on flow rate and temperature delta
 */
export function calculatePipeSizing(flowRate: number, deltaT: number) {
  // Simple pipe sizing calculation based on flow rate
  let pipeSize = 'dn110'; // Default size
  let velocityMS = 2.5; // Default velocity in m/s
  let pressureDropKpa = 1.5; // Default pressure drop in kPa/m
  
  if (flowRate > 1000) {
    pipeSize = 'dn160';
    velocityMS = 3.0;
    pressureDropKpa = 2.0;
  } else if (flowRate > 500) {
    pipeSize = 'dn125';
    velocityMS = 2.8;
    pressureDropKpa = 1.8;
  }
  
  return {
    pipeSize,
    velocityMS,
    pressureDropKpa
  };
}