import { serverTimestamp, getDoc } from 'firebase/firestore';
import { DEFAULT_PRICING, DEFAULT_CALCULATION_PARAMS } from '@/constants/calculatorConstants';
import { calculatorDebug } from '../calculatorDebug';
import { pricingCache, paramsCache, memoize } from '../calculationCache';
import { calculateBusbarCost } from '../calculatorUtils';
import { matrixDocRef } from '../matrixCalculatorHelpers';
import { getFirestoreOrThrow } from '@/services/firebaseHelpers';
import { PricingMatrix } from '@/types/pricingMatrix';
import { CalculationParams } from '@/types/calculationParams';
import { CostResult } from './types';

// Cached pricing and params
let cachedPricing: PricingMatrix | null = null;
let cachedParams: CalculationParams | null = null;
let lastFetchTime = 0;

/**
 * Fetch pricing and calculation parameters from Firestore
 */
export async function getPricingAndParams() {
  // Check if cache is valid (less than 5 minutes old)
  const now = Date.now();
  if (cachedPricing && cachedParams && now - lastFetchTime < 5 * 60 * 1000) {
    return { pricing: cachedPricing, params: cachedParams };
  }
  
  try {
    // Get Firestore safely
    const db = getFirestoreOrThrow();
    if (!db) {
      console.error('Firestore is not initialized, using default values');
      calculatorDebug.error('Firestore is not initialized', 'Using default values');
      return { pricing: DEFAULT_PRICING as unknown as PricingMatrix, params: DEFAULT_CALCULATION_PARAMS };
    }
    
    // Fetch pricing with better error handling
    let pricing: PricingMatrix = DEFAULT_PRICING as unknown as PricingMatrix;
    try {
      const pricingDoc = await getDoc(matrixDocRef('matrix_calculator', 'pricing_matrix'));
      if (pricingDoc.exists()) {
        pricing = pricingDoc.data() as PricingMatrix;
        console.log('Successfully fetched pricing matrix from Firestore');
      } else {
        console.log('Pricing matrix not found in Firestore, using default values');
      }
    } catch (pricingError) {
      console.error('Error fetching pricing matrix:', pricingError);
      calculatorDebug.error('Error fetching pricing matrix', pricingError);
    }
    
    // Fetch parameters with better error handling
    let params: CalculationParams = DEFAULT_CALCULATION_PARAMS;
    try {
      const paramsDoc = await getDoc(matrixDocRef('matrix_calculator', 'calculation_params'));
      if (paramsDoc.exists()) {
        const rawParams = paramsDoc.data();
        
        // Ensure redundancyMode is one of the allowed values
        if (rawParams.electrical && typeof rawParams.electrical.redundancyMode === 'string') {
          const mode = rawParams.electrical.redundancyMode;
          if (!['N', 'N+1', '2N'].includes(mode)) {
            rawParams.electrical.redundancyMode = 'N+1'; // Default to N+1 if invalid
          } else {
            // Explicitly cast to the union type
            rawParams.electrical.redundancyMode = mode as "N" | "N+1" | "2N";
          }
        }
        
        params = rawParams as CalculationParams;
        console.log('Successfully fetched calculation parameters from Firestore');
      } else {
        console.log('Calculation parameters not found in Firestore, using default values');
      }
    } catch (paramsError) {
      console.error('Error fetching calculation parameters:', paramsError);
      calculatorDebug.error('Error fetching calculation parameters', paramsError);
    }
    
    // Update cache
    cachedPricing = pricing;
    cachedParams = params;
    lastFetchTime = now;
    
    return { pricing, params };
  } catch (error) {
    console.error('Error fetching data from Firestore:', error);
    calculatorDebug.error('Error fetching data from Firestore', error);
    return { pricing: DEFAULT_PRICING as unknown as PricingMatrix, params: DEFAULT_CALCULATION_PARAMS };
  }
}

// Memoized version of getPricingAndParams
export const getMemoizedPricingAndParams = memoize(
  getPricingAndParams,
  pricingCache,
  () => 'pricing_and_params'
);

/**
 * Calculate costs based on configuration, pricing, and parameters
 */
export function calculateCost(config: any, pricing: PricingMatrix, params: CalculationParams): CostResult {
  try {
    // Add safety checks for all possible undefined inputs
    if (!config) throw new Error('Configuration is undefined');
    if (!pricing) throw new Error('Pricing matrix is undefined');
    if (!params) throw new Error('Calculation parameters is undefined');
    
    // Ensure required config properties exist
    const busbarSize = config.busbarSize || 'busbar800A';
    const coolingType = config.cooling?.type || 'air';
    const totalRacks = config.totalRacks || 28;
    
    // Get electrical properties with defaults
    const tapOffBox = config.electrical?.tapOffBox || 'standard63A';
    const rpdu = config.electrical?.rpdu || 'standard16A';
    
    // Calculate electrical costs
    const busbarCost = calculateBusbarCost(busbarSize, pricing);
    const tapOffBoxCost = pricing.tapOffBox[coolingType === 'dlc' ? 
      'custom250A' : tapOffBox] * totalRacks;
    const rpduCost = pricing.rpdu[rpdu] * totalRacks;
    
    // Calculate cooling costs with safety checks
    let coolingCost = 0;
    if (coolingType === 'dlc') {
      coolingCost = pricing.cooler.tcs310aXht + 
                   pricing.cooler.grundfosPump + 
                   pricing.cooler.bufferTank +
                   (config.cooling?.pipingSize === 'dn160' ? 
                    pricing.piping.dn160PerMeter : pricing.piping.dn110PerMeter) * 100 +
                   (config.cooling?.pipingSize === 'dn160' ? 
                    pricing.piping.valveDn160 : pricing.piping.valveDn110) * 10;
    } else if (coolingType === 'hybrid') {
      const dlcPortion = pricing.cooler.tcs310aXht * 0.7 +
                        pricing.cooler.grundfosPump + 
                        pricing.cooler.bufferTank +
                        pricing.piping.dn110PerMeter * 50;
      
      const airPortion = pricing.rdhx.average * Math.ceil(((config.cooling?.airPortion || 0) / 150) || 1);
      
      coolingCost = dlcPortion + airPortion;
    } else if (coolingType === 'immersion') {
      coolingCost = pricing.cooler.immersionTank * Math.ceil(totalRacks / 4) +
                   pricing.cooler.immersionCDU + 
                   pricing.piping.dn110PerMeter * 50;
    } else {
      // Default to air cooling with safety checks
      const rdhxModel = config.cooling?.rdhxModel || 'standard';
      const rdhxUnits = config.cooling?.rdhxUnits || Math.ceil(totalRacks / 10);
      coolingCost = pricing.rdhx[rdhxModel] * rdhxUnits;
    }
    
    // Calculate power costs with safety checks
    let upsCost = 0;
    if (config.power?.ups) {
      const frameSize = config.power.ups.frameSize || 'frame2Module';
      const framesNeeded = config.power.ups.framesNeeded || 1;
      const redundantModules = config.power.ups.redundantModules || 2;
      
      upsCost = pricing.ups[frameSize] * framesNeeded +
               pricing.ups.module250kw * redundantModules;
    }
    
    let batteryCost = 0;
    if (config.power?.battery) {
      const cabinetsNeeded = config.power.battery.cabinetsNeeded || 1;
      batteryCost = pricing.battery.revoTp240Cabinet * cabinetsNeeded;
    }
    
    // Calculate generator costs if included
    let generatorCost = 0;
    if (config.power?.generator && config.power.generator.included) {
      const generatorCapacity = config.power.generator.capacity || 1000;
      const generatorPriceKey = generatorCapacity <= 1000 ? 'generator1000kva' :
                               generatorCapacity <= 2000 ? 'generator2000kva' : 'generator3000kva';
      
      generatorCost = pricing.generator?.[generatorPriceKey] || 0;
      
      const fuelTankSize = config.power.generator.fuel?.tankSize || 0;
      generatorCost += fuelTankSize * (pricing.generator?.fuelTankPerLiter || 1);
    }
    
    // Calculate e-house costs
    const eHouseBaseSqm = params.power.eHouseBaseSqm || 20;
    const eHouseBatterySqm = params.power.eHouseBatterySqm || 5;
    const eHouseGeneratorSqm = (config.power?.generator?.included) ? 30 : 0;
    
    const framesNeeded = config.power?.ups?.framesNeeded || 1;
    const cabinetsNeeded = config.power?.battery?.cabinetsNeeded || 1;
    
    const eHouseSize = eHouseBaseSqm * framesNeeded +
                      eHouseBatterySqm * cabinetsNeeded +
                      eHouseGeneratorSqm;
    
    const eHouseCost = pricing.eHouse.base + pricing.eHouse.perSqMeter * eHouseSize;
    
    // Calculate sustainability options costs
    let sustainabilityCost = 0;
    if (pricing.sustainability) {
      if (config.sustainabilityOptions?.enableWasteHeatRecovery) {
        sustainabilityCost += pricing.sustainability.heatRecoverySystem || 0;
      }
      
      if (config.sustainabilityOptions?.enableWaterRecycling) {
        sustainabilityCost += pricing.sustainability.waterRecyclingSystem || 0;
      }
      
      const renewablePercentage = config.sustainabilityOptions?.renewableEnergyPercentage || 0;
      if (renewablePercentage > 0) {
        const solarCapacity = (config.kwPerRack * totalRacks * renewablePercentage / 100) * 1.5;
        sustainabilityCost += solarCapacity * (pricing.sustainability.solarPanelPerKw || 0);
      }
    }
    
    // Calculate total equipment cost
    const equipmentCost = busbarCost + tapOffBoxCost + rpduCost + coolingCost + 
                         upsCost + batteryCost + generatorCost + eHouseCost + sustainabilityCost;
    
    // Add installation and engineering costs
    const installationCost = equipmentCost * params.costFactors.installationPercentage;
    const engineeringCost = equipmentCost * params.costFactors.engineeringPercentage;
    const contingencyCost = equipmentCost * params.costFactors.contingencyPercentage;
    
    // Calculate total project cost
    const totalCost = equipmentCost + installationCost + engineeringCost + contingencyCost;
    
    // Return cost breakdown with safe rounding
    return {
      electrical: {
        busbar: Math.round(busbarCost || 0),
        tapOffBox: Math.round(tapOffBoxCost || 0),
        rpdu: Math.round(rpduCost || 0),
        total: Math.round((busbarCost || 0) + (tapOffBoxCost || 0) + (rpduCost || 0))
      },
      cooling: Math.round(coolingCost || 0),
      power: {
        ups: Math.round(upsCost || 0),
        battery: Math.round(batteryCost || 0),
        generator: Math.round(generatorCost || 0),
        total: Math.round((upsCost || 0) + (batteryCost || 0) + (generatorCost || 0))
      },
      infrastructure: Math.round(eHouseCost || 0),
      sustainability: Math.round(sustainabilityCost || 0),
      equipmentTotal: Math.round(equipmentCost || 0),
      installation: Math.round(installationCost || 0),
      engineering: Math.round(engineeringCost || 0),
      contingency: Math.round(contingencyCost || 0),
      totalProjectCost: Math.round(totalCost || 0),
      costPerRack: Math.round((totalCost || 0) / (totalRacks || 1)),
      costPerKw: Math.round((totalCost || 0) / ((config.kwPerRack || 10) * (totalRacks || 1)))
    };
  } catch (error) {
    console.error('Error calculating costs:', error);
    // Return a placeholder result to prevent errors cascading
    return {
      electrical: { busbar: 0, tapOffBox: 0, rpdu: 0, total: 0 },
      cooling: 0,
      power: { ups: 0, battery: 0, generator: 0, total: 0 },
      infrastructure: 0,
      sustainability: 0,
      equipmentTotal: 0,
      installation: 0,
      engineering: 0,
      contingency: 0,
      totalProjectCost: 0,
      costPerRack: 0,
      costPerKw: 0
    };
  }
}