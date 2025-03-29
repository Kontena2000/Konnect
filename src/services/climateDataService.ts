import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { CLIMATE_ZONES } from '@/constants/calculatorConstants';

export interface ClimateData {
  zone: string;
  avgTemperature: number;
  humidity: number;
  extremeWeatherRisk: string;
  energyRates: {
    costPerKWh: number;
    carbonIntensity: number;
    renewablePct: number;
  };
}

export interface Location {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: string;
  climateData: ClimateData;
}

export async function fetchClimateData(latitude: number, longitude: number): Promise<ClimateData> {
  // First check if we have this location in our database
  const db = getFirestore();
  
  try {
    // Try to find climate data for this location in our database
    const climateDataQuery = query(
      collection(db, 'matrix_calculator', 'climate_data', 'locations'),
      where('latitude', '==', Math.round(latitude)),
      where('longitude', '==', Math.round(longitude))
    );
    
    const querySnapshot = await getDocs(climateDataQuery);
    
    if (!querySnapshot.empty) {
      // We found climate data in our database
      const data = querySnapshot.docs[0].data();
      return data as ClimateData;
    }
  } catch (error) {
    console.error('Error fetching climate data from database:', error);
    // Continue with the fallback method
  }
  
  // Fallback: Determine climate zone based on latitude
  let zone;
  const absLat = Math.abs(latitude);
  
  if (absLat < 23.5) {
    zone = 'Tropical';
  } else if (absLat < 35) {
    zone = 'Arid';
  } else if (absLat < 50) {
    zone = 'Temperate';
  } else if (absLat < 70) {
    zone = 'Continental';
  } else {
    zone = 'Polar';
  }
  
  // Generate mock temperature and humidity
  // In reality, this would come from weather API
  const avgTemperature = 22 - (absLat / 4); // Rough estimate
  const humidity = Math.max(30, Math.min(90, 70 - absLat / 2));
  
  // Get regional energy rates
  const energyRates = await getRegionalEnergyRates(latitude, longitude);
  
  return {
    zone,
    avgTemperature,
    humidity,
    extremeWeatherRisk: absLat > 50 || absLat < 15 ? 'High' : 'Low',
    energyRates
  };
}

export function getClimateFactor(climateData: ClimateData, coolingType: string): number {
  // Calculate climate impact factor for cooling requirements
  let factor = 1.0;
  
  // Adjust for temperature
  if (climateData.avgTemperature > 30) {
    factor *= 1.2; // Hot climate needs more cooling
  } else if (climateData.avgTemperature < 10) {
    factor *= 0.9; // Cold climate needs less cooling
  }
  
  // Adjust for humidity (affects air-cooled more than DLC)
  if (coolingType === 'air-cooled' && climateData.humidity > 70) {
    factor *= 1.15; // High humidity impacts air cooling efficiency
  }
  
  return factor;
}

async function getRegionalEnergyRates(latitude: number, longitude: number) {
  const db = getFirestore();
  
  try {
    // Try to find energy rates for this region in our database
    const energyRatesQuery = query(
      collection(db, 'matrix_calculator', 'energy_rates', 'regions'),
      where('latitude', '==', Math.round(latitude)),
      where('longitude', '==', Math.round(longitude))
    );
    
    const querySnapshot = await getDocs(energyRatesQuery);
    
    if (!querySnapshot.empty) {
      // We found energy rates in our database
      return querySnapshot.docs[0].data().rates;
    }
  } catch (error) {
    console.error('Error fetching energy rates from database:', error);
    // Continue with the fallback method
  }
  
  // Fallback: Return mock data
  return {
    costPerKWh: 0.15, // USD per kWh
    carbonIntensity: 0.5, // kg CO2 per kWh
    renewablePct: 20 // Percentage from renewable sources
  };
}

export async function getLocationByAddress(address: string): Promise<Location | null> {
  // In a real implementation, this would use a geocoding API
  // For this example, we'll return mock data
  
  // Mock coordinates based on address
  // In reality, this would come from a geocoding API
  const mockCoordinates = {
    'New York': { latitude: 40.7128, longitude: -74.0060 },
    'London': { latitude: 51.5074, longitude: -0.1278 },
    'Tokyo': { latitude: 35.6762, longitude: 139.6503 },
    'Sydney': { latitude: -33.8688, longitude: 151.2093 },
    'Dubai': { latitude: 25.2048, longitude: 55.2708 },
  };
  
  // Find a matching location or use default
  let coordinates;
  for (const [city, coords] of Object.entries(mockCoordinates)) {
    if (address.toLowerCase().includes(city.toLowerCase())) {
      coordinates = coords;
      break;
    }
  }
  
  // Default to New York if no match
  if (!coordinates) {
    coordinates = mockCoordinates['New York'];
  }
  
  // Get climate data for these coordinates
  const climateData = await fetchClimateData(coordinates.latitude, coordinates.longitude);
  
  return {
    coordinates,
    address,
    climateData
  };
}