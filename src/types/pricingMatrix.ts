export interface PricingMatrix {
  busbar: {
    base1250A: number;
    base2000A: number;
    perMeter: number;
    copperPremium: number;
    busbar800A: number;
    busbar1000A: number;
    busbar1600A: number;
    [key: string]: number;
  };
  tapOffBox: {
    standard63A: number;
    custom100A: number;
    custom150A: number;
    custom200A: number;
    custom250A: number;
    [key: string]: number;
  };
  rpdu: {
    standard16A: number;
    standard32A: number;
    standard80A: number;
    standard112A: number;
    [key: string]: number;
  };
  cooler: {
    tcs310aXht: number;
    grundfosPump: number;
    bufferTank: number;
    immersionTank: number;
    immersionCDU: number;
    [key: string]: number;
  };
  rdhx: {
    basic: number;
    standard: number;
    highDensity: number;
    average: number;
    [key: string]: number;
  };
  piping: {
    dn110PerMeter: number;
    dn160PerMeter: number;
    valveDn110: number;
    valveDn160: number;
    [key: string]: number;
  };
  ups: {
    frame2Module: number;
    frame4Module: number;
    frame6Module: number;
    module250kw: number;
    [key: string]: number;
  };
  battery: {
    revoTp240Cabinet: number;
    [key: string]: number;
  };
  generator: {
    generator1000kva: number;
    generator2000kva: number;
    generator3000kva: number;
    fuelTankPerLiter: number;
    [key: string]: number;
  };
  eHouse: {
    base: number;
    perSqMeter: number;
    [key: string]: number;
  };
  sustainability: {
    heatRecoverySystem: number;
    waterRecyclingSystem: number;
    solarPanelPerKw: number;
    [key: string]: number;
  };
  [key: string]: { [key: string]: number };
}