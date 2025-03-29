import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { CLIMATE_ZONES } from '@/constants/calculatorConstants';

// Add this interface to the top of the file
export interface ClimateFactor {
  temperature: number;
  humidity: number;
  coolingFactor: number;
  renewableEnergyPotential: number;
  waterScarcityFactor?: number;
  zone?: string;
}

export interface ClimateData {
  zone: string;
  avgTemperature: number;
  humidity: number;
  extremeWeatherRisk?: string;
  energyRates?: {
    costPerKWh: number;
    carbonIntensity: number;
    renewablePct: number;
  };
  // Add coordinates to the interface
  coordinates?: {
    latitude: number;
    longitude: number;
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
  try {
    // For demo purposes, return mock data based on latitude
    // In a real app, this would call an API
    
    // Determine climate zone based on latitude
    let zone;
    if (Math.abs(latitude) < 23.5) {
      zone = 'TROPICAL';
    } else if (Math.abs(latitude) < 35) {
      zone = 'ARID';
    } else if (Math.abs(latitude) < 50) {
      zone = 'TEMPERATE';
    } else if (Math.abs(latitude) < 66.5) {
      zone = 'CONTINENTAL';
    } else {
      zone = 'POLAR';
    }
    
    // Generate some reasonable values based on the zone
    let avgTemperature, humidity;
    
    switch (zone) {
      case 'TROPICAL':
        avgTemperature = 28 + (Math.random() * 4 - 2);
        humidity = 75 + (Math.random() * 10);
        break;
      case 'ARID':
        avgTemperature = 25 + (Math.random() * 8 - 4);
        humidity = 30 + (Math.random() * 20);
        break;
      case 'TEMPERATE':
        avgTemperature = 15 + (Math.random() * 6 - 3);
        humidity = 50 + (Math.random() * 20);
        break;
      case 'CONTINENTAL':
        avgTemperature = 5 + (Math.random() * 10 - 5);
        humidity = 40 + (Math.random() * 20);
        break;
      case 'POLAR':
        avgTemperature = -10 + (Math.random() * 10);
        humidity = 30 + (Math.random() * 20);
        break;
      default:
        avgTemperature = 15;
        humidity = 50;
    }
    
    // Return climate data with coordinates in the proper format
    return {
      zone,
      avgTemperature,
      humidity,
      coordinates: {
        latitude,
        longitude
      },
      // Add default energy rates
      energyRates: {
        costPerKWh: 0.15,
        carbonIntensity: 0.5,
        renewablePct: 20
      }
    };
  } catch (error) {
    console.error('Error fetching climate data:', error);
    throw new Error('Failed to fetch climate data');
  }
}

export function getClimateFactor(climateData: any, coolingType: string): number {
  try {
    // Default factor if we can't determine climate
    if (!climateData || !climateData.zone) {
      return 1.0;
    }
    
    // Get base cooling factor from climate zone
    let baseFactor = 1.0;
    switch (climateData.zone) {
      case 'TROPICAL':
        baseFactor = 1.2;
        break;
      case 'ARID':
        baseFactor = 1.15;
        break;
      case 'TEMPERATE':
        baseFactor = 1.0;
        break;
      case 'CONTINENTAL':
        baseFactor = 0.95;
        break;
      case 'POLAR':
        baseFactor = 0.9;
        break;
      default:
        baseFactor = 1.0;
    }
    
    // Adjust based on cooling type
    if (coolingType === 'dlc') {
      // DLC is less affected by climate
      return 1.0 + ((baseFactor - 1.0) * 0.5);
    }
    
    return baseFactor;
  } catch (error) {
    console.error('Error calculating climate factor:', error);
    return 1.0; // Default to no adjustment on error
  }
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