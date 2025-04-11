import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { CalculationConfig, CalculationOptions } from "./matrixCalculatorService";
import { formatCurrency, formatNumber } from "@/utils/formatters";

// Add the autotable plugin type to jsPDF
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ReportOptions {
  includeFormulas?: boolean;
  includeDetailedBreakdown?: boolean;
  companyName?: string;
  projectName?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  preparedBy?: string;
  date?: string;
  logo?: string;
}

/**
 * Generate a detailed PDF report for a calculation
 */
export async function generateCalculationPdfReport(
  config: CalculationConfig,
  results: any,
  options: CalculationOptions = {},
  reportOptions: ReportOptions = {}
): Promise<Blob> {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Default report options
  const defaultReportOptions: ReportOptions = {
    includeFormulas: true,
    includeDetailedBreakdown: true,
    companyName: "Kontena",
    projectName: "Data Center Project",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    preparedBy: "",
    date: new Date().toLocaleDateString(),
  };

  // Merge default options with provided options
  const finalReportOptions = { ...defaultReportOptions, ...reportOptions };

  // Add report header
  addReportHeader(doc, config, finalReportOptions);

  // Add executive summary
  addExecutiveSummary(doc, config, results, options);

  // Add calculation parameters
  addCalculationParameters(doc, config, options);

  // Add power requirements section
  addPowerRequirementsSection(doc, results);

  // Add cooling solution section
  addCoolingSolutionSection(doc, results);

  // Add detailed cost breakdown
  addDetailedCostBreakdown(doc, results, finalReportOptions.includeDetailedBreakdown);

  // Add formulas section if requested
  if (finalReportOptions.includeFormulas) {
    addFormulasSection(doc, config, results);
  }

  // Add sustainability metrics
  addSustainabilityMetrics(doc, results);

  // Add TCO analysis
  addTCOAnalysis(doc, results);

  // Add footer with page numbers
  addFooter(doc);

  // Return the PDF as a blob
  return doc.output("blob");
}

/**
 * Add the report header with company info and project details
 */
function addReportHeader(doc: jsPDF, config: CalculationConfig, options: ReportOptions) {
  // Add logo if provided
  if (options.logo) {
    try {
      doc.addImage(options.logo, "JPEG", 15, 10, 40, 20);
    } catch (error) {
      console.error("Error adding logo to PDF:", error);
    }
  }

  // Add title
  doc.setFontSize(20);
  doc.setTextColor(0, 51, 102); // Dark blue
  doc.text("Data Center Configuration Report", 105, 20, { align: "center" });

  // Add company and project info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Company: ${options.companyName}`, 105, 30, { align: "center" });
  doc.text(`Project: ${options.projectName}`, 105, 36, { align: "center" });

  if (options.clientName) {
    doc.text(`Client: ${options.clientName}`, 105, 42, { align: "center" });
  }

  // Add date and prepared by
  doc.setFontSize(10);
  doc.text(`Date: ${options.date}`, 195, 20, { align: "right" });
  
  if (options.preparedBy) {
    doc.text(`Prepared by: ${options.preparedBy}`, 195, 25, { align: "right" });
  }

  // Add horizontal line
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.5);
  doc.line(15, 50, 195, 50);

  // Add project details in a clean table format without borders
  doc.setFontSize(16);
  doc.setTextColor(0, 51, 102);
  doc.text("Project Information", 15, 65);
  
  const projectData = [
    ["Project Name", options.projectName || "Data Center Project"],
    ["Description", "Data center configuration and calculation report"],
    ["Status", "Planning"]
  ];
  
  doc.autoTable({
    startY: 70,
    body: projectData,
    theme: "plain", // Use plain theme for borderless table
    styles: { 
      fontSize: 11,
      cellPadding: 5
    },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 120 }
    }
  });
  
  // Add client information if available
  if (options.clientName || options.clientEmail || options.clientPhone || options.clientAddress) {
    const clientY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Client Information", 15, clientY);
    
    const clientData = [
      ["Company Name", options.clientName || "Not specified"],
      ["Email", options.clientEmail || "Not specified"],
      ["Phone", options.clientPhone || "Not specified"],
      ["Address", options.clientAddress || "Not specified"]
    ];
    
    doc.autoTable({
      startY: clientY + 5,
      body: clientData,
      theme: "plain", // Use plain theme for borderless table
      styles: { 
        fontSize: 11,
        cellPadding: 5
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 120 }
      }
    });
  }

  // Move to next section
  doc.setFontSize(12);
}

/**
 * Add executive summary section with key metrics
 */
function addExecutiveSummary(
  doc: jsPDF, 
  config: CalculationConfig, 
  results: any, 
  options: CalculationOptions
) {
  const startY = 60;
  
  // Section title
  doc.setFontSize(16);
  doc.setTextColor(0, 51, 102);
  doc.text("Executive Summary", 15, startY);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  // Create summary table
  const tableData = [
    ["Total IT Load", `${formatNumber(results.rack.totalITLoad)} kW`],
    ["Number of Racks", `${formatNumber(results.rack.totalRacks)}`],
    ["Power Density", `${formatNumber(results.rack.powerDensity)} kW/rack`],
    ["Cooling Type", `${capitalizeFirstLetter(results.rack.coolingType)}`],
    ["Redundancy", `${options.redundancyMode || "N+1"}`],
    ["Total Project Cost", `${formatCurrency(results.cost.totalProjectCost)}`],
    ["Cost per Rack", `${formatCurrency(results.cost.costPerRack)}`],
    ["Cost per kW", `${formatCurrency(results.cost.costPerKw)}`],
    ["PUE", `${formatNumber(results.sustainability.pue, 2)}`],
    ["Tier Level", `${results.reliability.tier}`],
    ["Availability", `${results.reliability.availability}`]
  ];
  
  doc.autoTable({
    startY: startY + 5,
    head: [["Metric", "Value"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80 }
    }
  });
  
  // Move to next section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  return finalY;
}

/**
 * Add calculation parameters section
 */
function addCalculationParameters(
  doc: jsPDF, 
  config: CalculationConfig, 
  options: CalculationOptions
) {
  const startY = (doc as any).lastAutoTable.finalY + 10;
  
  // Section title
  doc.setFontSize(16);
  doc.setTextColor(0, 51, 102);
  doc.text("Calculation Parameters", 15, startY);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  // Create parameters table
  const tableData = [
    ["Power Density per Rack", `${formatNumber(config.kwPerRack)} kW`],
    ["Total Number of Racks", `${formatNumber(config.totalRacks || 28)}`],
    ["Cooling Solution", `${capitalizeFirstLetter(config.coolingType)}`],
    ["Redundancy Mode", `${options.redundancyMode || "N+1"}`],
    ["Battery Runtime", `${options.batteryRuntime || 10} minutes`],
    ["Generator Included", `${options.includeGenerator ? "Yes" : "No"}`]
  ];
  
  // Add sustainability options if present
  if (options.sustainabilityOptions) {
    if (options.sustainabilityOptions.enableWasteHeatRecovery) {
      tableData.push(["Waste Heat Recovery", "Enabled"]);
    }
    
    if (options.sustainabilityOptions.enableWaterRecycling) {
      tableData.push(["Water Recycling", "Enabled"]);
    }
    
    if (options.sustainabilityOptions.renewableEnergyPercentage) {
      tableData.push(["Renewable Energy", `${options.sustainabilityOptions.renewableEnergyPercentage}%`]);
    }
  }
  
  doc.autoTable({
    startY: startY + 5,
    head: [["Parameter", "Value"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80 }
    }
  });
  
  // Move to next section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  return finalY;
}

/**
 * Add power requirements section
 */
function addPowerRequirementsSection(doc: jsPDF, results: any) {
  const startY = (doc as any).lastAutoTable.finalY + 10;
  
  // Section title
  doc.setFontSize(16);
  doc.setTextColor(0, 51, 102);
  doc.text("Power Requirements", 15, startY);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  // UPS subsection
  doc.setFontSize(14);
  doc.text("UPS System", 15, startY + 10);
  
  const upsData = [
    ["Total IT Load", `${formatNumber(results.power.ups.totalITLoad)} kW`],
    ["Redundancy Factor", `${formatNumber(results.power.ups.redundancyFactor, 2)}`],
    ["Required UPS Capacity", `${formatNumber(results.power.ups.requiredCapacity)} kW`],
    ["UPS Module Size", `${formatNumber(results.power.ups.moduleSize)} kW`],
    ["Total UPS Modules", `${formatNumber(results.power.ups.totalModulesNeeded)}`],
    ["UPS Frames Required", `${formatNumber(results.power.ups.framesNeeded)}`]
  ];
  
  doc.autoTable({
    startY: startY + 15,
    body: upsData,
    theme: "plain",
    styles: { fontSize: 10 },
    margin: { left: 20, right: 15 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80 }
    }
  });
  
  // Battery subsection
  const batteryY = (doc as any).lastAutoTable.finalY + 5;
  doc.setFontSize(14);
  doc.text("Battery System", 15, batteryY);
  
  const batteryData = [
    ["Runtime", `${formatNumber(results.power.battery.runtime)} minutes`],
    ["Energy Needed", `${formatNumber(results.power.battery.energyNeeded)} kWh`],
    ["Battery Cabinets", `${formatNumber(results.power.battery.cabinetsNeeded)}`],
    ["Total Weight", `${formatNumber(results.power.battery.totalWeight)} kg`]
  ];
  
  doc.autoTable({
    startY: batteryY + 5,
    body: batteryData,
    theme: "plain",
    styles: { fontSize: 10 },
    margin: { left: 20, right: 15 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80 }
    }
  });
  
  // Generator subsection if included
  if (results.power.generator.included) {
    const generatorY = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(14);
    doc.text("Generator System", 15, generatorY);
    
    const generatorData = [
      ["Generator Capacity", `${formatNumber(results.power.generator.capacity)} kVA`],
      ["Generator Model", `${results.power.generator.model}`],
      ["Fuel Tank Size", `${formatNumber(results.power.generator.fuel.tankSize)} L`],
      ["Fuel Consumption", `${formatNumber(results.power.generator.fuel.consumption)} L/hr`],
      ["Runtime at Full Load", `${formatNumber(results.power.generator.fuel.runtime)} hours`]
    ];
    
    doc.autoTable({
      startY: generatorY + 5,
      body: generatorData,
      theme: "plain",
      styles: { fontSize: 10 },
      margin: { left: 20, right: 15 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 80 }
      }
    });
  }
  
  // Electrical distribution subsection
  const electricalY = (doc as any).lastAutoTable.finalY + 5;
  doc.setFontSize(14);
  doc.text("Electrical Distribution", 15, electricalY);
  
  const electricalData = [
    ["Current per Row", `${formatNumber(results.electrical.currentPerRow)} A`],
    ["Current per Rack", `${formatNumber(results.electrical.currentPerRack)} A`],
    ["Busbar Size", `${results.electrical.busbarSize}`],
    ["Tap-Off Box", `${results.electrical.tapOffBox}`],
    ["rPDU Type", `${results.electrical.rpdu}`]
  ];
  
  if (results.electrical.multiplicityWarning) {
    electricalData.push(["Warning", results.electrical.multiplicityWarning]);
  }
  
  doc.autoTable({
    startY: electricalY + 5,
    body: electricalData,
    theme: "plain",
    styles: { fontSize: 10 },
    margin: { left: 20, right: 15 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80 }
    }
  });
  
  // Move to next section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  return finalY;
}

/**
 * Add cooling solution section
 */
function addCoolingSolutionSection(doc: jsPDF, results: any) {
  const startY = (doc as any).lastAutoTable.finalY + 10;
  
  // Check if we need to add a new page
  if (startY > 250) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Cooling Solution", 15, 20);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    addCoolingDetails(doc, results, 25);
  } else {
    // Section title
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Cooling Solution", 15, startY);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    addCoolingDetails(doc, results, startY + 10);
  }
  
  // Move to next section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  return finalY;
}

/**
 * Add cooling details based on cooling type
 */
function addCoolingDetails(doc: jsPDF, results: any, startY: number) {
  // Common cooling data
  const coolingData = [
    ["Cooling Type", `${capitalizeFirstLetter(results.cooling.type)}`],
    ["Total Cooling Capacity", `${formatNumber(results.cooling.totalCapacity)} kW`],
    ["PUE", `${formatNumber(results.cooling.pue, 2)}`]
  ];
  
  // Add cooling type specific data
  if (results.cooling.type === 'dlc') {
    coolingData.push(
      ["DLC Cooling Capacity", `${formatNumber(results.cooling.dlcCoolingCapacity)} kW`],
      ["Residual Cooling Capacity", `${formatNumber(results.cooling.residualCoolingCapacity)} kW`],
      ["DLC Flow Rate", `${formatNumber(results.cooling.dlcFlowRate)} L/min`],
      ["Piping Size", `${results.cooling.pipingSize}`]
    );
  } else if (results.cooling.type === 'hybrid') {
    coolingData.push(
      ["DLC Portion", `${formatNumber(results.cooling.dlcPortion)} kW`],
      ["Air Portion", `${formatNumber(results.cooling.airPortion)} kW`],
      ["DLC Flow Rate", `${formatNumber(results.cooling.dlcFlowRate)} L/min`],
      ["RDHX Units", `${formatNumber(results.cooling.rdhxUnits)}`],
      ["RDHX Model", `${results.cooling.rdhxModel}`],
      ["Piping Size", `${results.cooling.pipingSize}`]
    );
  } else if (results.cooling.type === 'immersion') {
    coolingData.push(
      ["Immersion Tanks Needed", `${formatNumber(results.cooling.tanksNeeded)}`],
      ["Flow Rate", `${formatNumber(results.cooling.flowRate)} L/min`],
      ["Piping Size", `${results.cooling.pipingSize}`]
    );
  } else {
    // Air cooling
    coolingData.push(
      ["RDHX Units", `${formatNumber(results.cooling.rdhxUnits)}`],
      ["RDHX Model", `${results.cooling.rdhxModel}`]
    );
  }
  
  doc.autoTable({
    startY: startY,
    body: coolingData,
    theme: "plain",
    styles: { fontSize: 10 },
    margin: { left: 20, right: 15 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80 }
    }
  });
}

/**
 * Add detailed cost breakdown section
 */
function addDetailedCostBreakdown(doc: jsPDF, results: any, includeDetailedBreakdown: boolean = true) {
  const startY = (doc as any).lastAutoTable.finalY + 10;
  
  // Check if we need to add a new page
  if (startY > 250) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Cost Breakdown", 15, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    addCostDetails(doc, results, 25, includeDetailedBreakdown);
  } else {
    // Section title
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Cost Breakdown", 15, startY);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    addCostDetails(doc, results, startY + 10, includeDetailedBreakdown);
  }
  
  // Move to next section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  return finalY;
}

/**
 * Add cost breakdown details
 */
function addCostDetails(doc: jsPDF, results: any, startY: number, includeDetailedBreakdown: boolean) {
  // Summary cost table
  const costSummaryData = [
    ["Electrical Distribution", formatCurrency(results.cost.electrical.total)],
    ["Cooling System", formatCurrency(results.cost.cooling)],
    ["Power System", formatCurrency(results.cost.power.total)],
    ["Infrastructure", formatCurrency(results.cost.infrastructure)],
    ["Sustainability Features", formatCurrency(results.cost.sustainability)],
    ["Equipment Subtotal", formatCurrency(results.cost.equipmentTotal)],
    ["Installation", formatCurrency(results.cost.installation)],
    ["Engineering", formatCurrency(results.cost.engineering)],
    ["Contingency", formatCurrency(results.cost.contingency)],
    ["Total Project Cost", formatCurrency(results.cost.totalProjectCost)]
  ];
  
  doc.autoTable({
    startY: startY,
    head: [["Cost Category", "Amount"]],
    body: costSummaryData,
    theme: "grid",
    headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80, halign: 'right' }
    },
    foot: [["Cost per Rack", formatCurrency(results.cost.costPerRack)], 
           ["Cost per kW", formatCurrency(results.cost.costPerKw)]],
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' }
  });
  
  // If detailed breakdown is requested, add subcategories
  if (includeDetailedBreakdown) {
    const detailedY = (doc as any).lastAutoTable.finalY + 10;
    
    // Check if we need to add a new page for the remaining tables
    if (detailedY > 250) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102);
      doc.text("Detailed Cost Breakdown", 15, 20);
      
      addDetailedCostTables(doc, results, 25);
    } else {
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102);
      doc.text("Detailed Cost Breakdown", 15, detailedY);
      
      addDetailedCostTables(doc, results, detailedY + 10);
    }
  }
}

/**
 * Add detailed cost tables for each category
 */
function addDetailedCostTables(doc: jsPDF, results: any, startY: number) {
  // Electrical costs
  const electricalData = [
    ["Busbar System", formatCurrency(results.cost.electrical.busbar)],
    ["Tap-Off Boxes", formatCurrency(results.cost.electrical.tapOffBox)],
    ["rPDUs", formatCurrency(results.cost.electrical.rpdu)],
    ["Total Electrical", formatCurrency(results.cost.electrical.total)]
  ];
  
  doc.autoTable({
    startY: startY,
    head: [["Electrical Distribution", "Cost"]],
    body: electricalData,
    theme: "grid",
    headStyles: { fillColor: [0, 71, 122], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
    margin: { left: 20, right: 15 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 70, halign: 'right' }
    }
  });
  
  // Power costs
  const powerY = (doc as any).lastAutoTable.finalY + 5;
  const powerData = [
    ["UPS System", formatCurrency(results.cost.power.ups)],
    ["Battery System", formatCurrency(results.cost.power.battery)]
  ];
  
  if (results.power.generator.included) {
    powerData.push(["Generator System", formatCurrency(results.cost.power.generator)]);
  }
  
  powerData.push(["Total Power", formatCurrency(results.cost.power.total)]);
  
  doc.autoTable({
    startY: powerY,
    head: [["Power System", "Cost"]],
    body: powerData,
    theme: "grid",
    headStyles: { fillColor: [0, 71, 122], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
    margin: { left: 20, right: 15 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 70, halign: 'right' }
    }
  });
  
  // Check if we need to add a new page for the remaining tables
  if ((doc as any).lastAutoTable.finalY > 220) {
    doc.addPage();
    
    // Add sustainability costs if any
    if (results.cost.sustainability > 0) {
      const sustainabilityData = [];
      
      if (results.sustainabilityOptions?.enableWasteHeatRecovery) {
        sustainabilityData.push(["Waste Heat Recovery", formatCurrency(100000)]);
      }
      
      if (results.sustainabilityOptions?.enableWaterRecycling) {
        sustainabilityData.push(["Water Recycling", formatCurrency(80000)]);
      }
      
      if (results.sustainabilityOptions?.renewableEnergyPercentage > 0) {
        sustainabilityData.push(["Renewable Energy", formatCurrency(results.cost.sustainability - 180000)]);
      }
      
      sustainabilityData.push(["Total Sustainability", formatCurrency(results.cost.sustainability)]);
      
      doc.autoTable({
        startY: 20,
        head: [["Sustainability Features", "Cost"]],
        body: sustainabilityData,
        theme: "grid",
        headStyles: { fillColor: [0, 71, 122], textColor: [255, 255, 255] },
        styles: { fontSize: 9 },
        margin: { left: 20, right: 15 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 70, halign: 'right' }
        }
      });
    }
  } else {
    // Add sustainability costs if any
    if (results.cost.sustainability > 0) {
      const sustainabilityY = (doc as any).lastAutoTable.finalY + 5;
      const sustainabilityData = [];
      
      if (results.sustainabilityOptions?.enableWasteHeatRecovery) {
        sustainabilityData.push(["Waste Heat Recovery", formatCurrency(100000)]);
      }
      
      if (results.sustainabilityOptions?.enableWaterRecycling) {
        sustainabilityData.push(["Water Recycling", formatCurrency(80000)]);
      }
      
      if (results.sustainabilityOptions?.renewableEnergyPercentage > 0) {
        sustainabilityData.push(["Renewable Energy", formatCurrency(results.cost.sustainability - 180000)]);
      }
      
      sustainabilityData.push(["Total Sustainability", formatCurrency(results.cost.sustainability)]);
      
      doc.autoTable({
        startY: sustainabilityY,
        head: [["Sustainability Features", "Cost"]],
        body: sustainabilityData,
        theme: "grid",
        headStyles: { fillColor: [0, 71, 122], textColor: [255, 255, 255] },
        styles: { fontSize: 9 },
        margin: { left: 20, right: 15 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 70, halign: 'right' }
        }
      });
    }
  }
}

/**
 * Add formulas section to explain calculations
 */
function addFormulasSection(doc: jsPDF, config: CalculationConfig, results: any) {
  // Check if we need to add a new page
  if ((doc as any).lastAutoTable.finalY > 220) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Calculation Formulas", 15, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    addFormulaDetails(doc, config, results, 30);
  } else {
    const startY = (doc as any).lastAutoTable.finalY + 10;
    
    // Section title
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Calculation Formulas", 15, startY);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    addFormulaDetails(doc, config, results, startY + 10);
  }
}

/**
 * Add formula details
 */
function addFormulaDetails(doc: jsPDF, config: CalculationConfig, results: any, startY: number) {
  const formulaData = [
    ["Total IT Load", `${config.kwPerRack} kW × ${config.totalRacks || 28} racks = ${results.rack.totalITLoad} kW`],
    ["UPS Capacity", `${results.rack.totalITLoad} kW × ${results.power.ups.redundancyFactor} (redundancy) = ${results.power.ups.requiredCapacity} kW`],
    ["UPS Modules", `Ceiling(${results.power.ups.requiredCapacity} kW ÷ ${results.power.ups.moduleSize} kW) = ${results.power.ups.totalModulesNeeded} modules`],
    ["Battery Energy", `${results.rack.totalITLoad} kW × ${results.power.battery.runtime} min ÷ 60 = ${results.power.battery.energyNeeded} kWh`],
    ["Battery Cabinets", `Ceiling(${results.power.battery.energyNeeded} kWh ÷ 40 kWh) = ${results.power.battery.cabinetsNeeded} cabinets`],
    ["Cooling Capacity", `${results.rack.totalITLoad} kW × 1.1 = ${results.cooling.totalCapacity} kW`]
  ];
  
  // Add cooling type specific formulas
  if (results.cooling.type === 'dlc') {
    formulaData.push(
      ["DLC Cooling", `${results.rack.totalITLoad} kW × 0.75 = ${results.cooling.dlcCoolingCapacity} kW`],
      ["Residual Cooling", `${results.rack.totalITLoad} kW × 0.25 = ${results.cooling.residualCoolingCapacity} kW`],
      ["DLC Flow Rate", `${results.cooling.dlcCoolingCapacity} kW × 0.25 = ${results.cooling.dlcFlowRate} L/min`]
    );
  } else if (results.cooling.type === 'hybrid') {
    formulaData.push(
      ["DLC Portion", `${results.rack.totalITLoad} kW × 0.6 = ${results.cooling.dlcPortion} kW`],
      ["Air Portion", `${results.rack.totalITLoad} kW × 0.4 = ${results.cooling.airPortion} kW`],
      ["DLC Flow Rate", `${results.cooling.dlcPortion} kW × 0.25 = ${results.cooling.dlcFlowRate} L/min`],
      ["RDHX Units", `Ceiling(${results.cooling.airPortion} kW ÷ 150 kW) = ${results.cooling.rdhxUnits} units`]
    );
  } else if (results.cooling.type === 'immersion') {
    formulaData.push(
      ["Immersion Tanks", `Ceiling(${results.rack.totalRacks} racks ÷ 4) = ${results.cooling.tanksNeeded} tanks`],
      ["Flow Rate", `${results.cooling.totalCapacity} kW × 0.25 × 0.8 = ${results.cooling.flowRate} L/min`]
    );
  } else {
    // Air cooling
    formulaData.push(
      ["RDHX Units", `Ceiling(${results.cooling.totalCapacity} kW ÷ 150 kW) = ${results.cooling.rdhxUnits} units`]
    );
  }
  
  // Add cost formulas
  formulaData.push(
    ["Equipment Cost", `Electrical (${formatCurrency(results.cost.electrical.total)}) + Cooling (${formatCurrency(results.cost.cooling)}) + Power (${formatCurrency(results.cost.power.total)}) + Infrastructure (${formatCurrency(results.cost.infrastructure)}) + Sustainability (${formatCurrency(results.cost.sustainability)}) = ${formatCurrency(results.cost.equipmentTotal)}`],
    ["Installation Cost", `${formatCurrency(results.cost.equipmentTotal)} × 15% = ${formatCurrency(results.cost.installation)}`],
    ["Engineering Cost", `${formatCurrency(results.cost.equipmentTotal)} × 10% = ${formatCurrency(results.cost.engineering)}`],
    ["Contingency", `${formatCurrency(results.cost.equipmentTotal)} × 10% = ${formatCurrency(results.cost.contingency)}`],
    ["Total Project Cost", `${formatCurrency(results.cost.equipmentTotal)} + ${formatCurrency(results.cost.installation)} + ${formatCurrency(results.cost.engineering)} + ${formatCurrency(results.cost.contingency)} = ${formatCurrency(results.cost.totalProjectCost)}`],
    ["Cost per Rack", `${formatCurrency(results.cost.totalProjectCost)} ÷ ${results.rack.totalRacks} = ${formatCurrency(results.cost.costPerRack)}`],
    ["Cost per kW", `${formatCurrency(results.cost.totalProjectCost)} ÷ ${results.rack.totalITLoad} = ${formatCurrency(results.cost.costPerKw)}`]
  );
  
  doc.autoTable({
    startY: startY,
    head: [["Calculation", "Formula"]],
    body: formulaData,
    theme: "grid",
    headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 110 }
    }
  });
}

/**
 * Add sustainability metrics section
 */
function addSustainabilityMetrics(doc: jsPDF, results: any) {
  // Check if we need to add a new page
  if ((doc as any).lastAutoTable.finalY > 220) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Sustainability Metrics", 15, 20);
    
    addSustainabilityDetails(doc, results, 30);
  } else {
    const startY = (doc as any).lastAutoTable.finalY + 10;
    
    // Section title
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Sustainability Metrics", 15, startY);
    
    addSustainabilityDetails(doc, results, startY + 10);
  }
}

/**
 * Add sustainability details
 */
function addSustainabilityDetails(doc: jsPDF, results: any, startY: number) {
  // Energy consumption
  const energyData = [
    ["IT Equipment", `${formatNumber(results.sustainability.annualEnergyConsumption.it)} kWh`],
    ["Cooling", `${formatNumber(results.sustainability.annualEnergyConsumption.cooling)} kWh`],
    ["Power Distribution", `${formatNumber(results.sustainability.annualEnergyConsumption.power)} kWh`],
    ["Total Annual Energy", `${formatNumber(results.sustainability.annualEnergyConsumption.total)} kWh`],
    ["Overhead Energy", `${formatNumber(results.sustainability.annualEnergyConsumption.overhead)} kWh`]
  ];
  
  doc.autoTable({
    startY: startY,
    head: [["Annual Energy Consumption", "Amount"]],
    body: energyData,
    theme: "grid",
    headStyles: { fillColor: [0, 71, 122], textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80 }
    }
  });
  
  // Carbon footprint
  const carbonY = (doc as any).lastAutoTable.finalY + 5;
  const carbonData = [
    ["Grid Emissions", `${formatNumber(results.carbonFootprint.gridEmissions)} tons CO2e`]
  ];
  
  if (results.power.generator.included) {
    carbonData.push(["Generator Emissions", `${formatNumber(results.carbonFootprint.generatorEmissions)} tons CO2e`]);
  }
  
  carbonData.push(
    ["Total Annual Emissions", `${formatNumber(results.carbonFootprint.totalAnnualEmissions)} tons CO2e`],
    ["Emissions per MWh", `${formatNumber(results.carbonFootprint.emissionsPerMWh)} kg CO2e/MWh`]
  );
  
  if (results.carbonFootprint.renewableImpact) {
    carbonData.push(
      ["Renewable Energy", `${formatNumber(results.carbonFootprint.renewableImpact.percentage)}%`],
      ["Emissions Avoided", `${formatNumber(results.carbonFootprint.renewableImpact.emissionsAvoided)} tons CO2e`]
    );
  }
  
  doc.autoTable({
    startY: carbonY,
    head: [["Carbon Footprint", "Amount"]],
    body: carbonData,
    theme: "grid",
    headStyles: { fillColor: [0, 71, 122], textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80 }
    }
  });
  
  // Efficiency metrics
  const efficiencyY = (doc as any).lastAutoTable.finalY + 5;
  const efficiencyData = [
    ["Power Usage Effectiveness (PUE)", `${formatNumber(results.sustainability.pue, 2)}`],
    ["Water Usage Effectiveness (WUE)", `${formatNumber(results.sustainability.wue, 2)}`]
  ];
  
  doc.autoTable({
    startY: efficiencyY,
    head: [["Efficiency Metrics", "Value"]],
    body: efficiencyData,
    theme: "grid",
    headStyles: { fillColor: [0, 71, 122], textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80 }
    }
  });
}

/**
 * Add TCO analysis section
 */
function addTCOAnalysis(doc: jsPDF, results: any) {
  // Check if we need to add a new page
  if ((doc as any).lastAutoTable.finalY > 220) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Total Cost of Ownership (TCO)", 15, 20);
    
    addTCODetails(doc, results, 30);
  } else {
    const startY = (doc as any).lastAutoTable.finalY + 10;
    
    // Section title
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Total Cost of Ownership (TCO)", 15, startY);
    
    addTCODetails(doc, results, startY + 10);
  }
}

/**
 * Add TCO details
 */
function addTCODetails(doc: jsPDF, results: any, startY: number) {
  // TCO breakdown
  const tcoData = [
    ["Capital Expenditure (CAPEX)", formatCurrency(results.tco.capex)],
    ["Annual Operational Expenditure (OPEX)", formatCurrency(results.tco.opex.annual)],
    ["Annual Energy Cost", formatCurrency(results.tco.opex.energy)],
    ["Annual Maintenance Cost", formatCurrency(results.tco.opex.maintenance)],
    ["Annual Operational Cost", formatCurrency(results.tco.opex.operational)],
    ["5-Year Total Cost of Ownership", formatCurrency(results.tco.total5Year)],
    ["10-Year Total Cost of Ownership", formatCurrency(results.tco.total10Year)]
  ];
  
  doc.autoTable({
    startY: startY,
    head: [["TCO Component", "Amount"]],
    body: tcoData,
    theme: "grid",
    headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 60, halign: 'right' }
    }
  });
}

/**
 * Add footer with page numbers
 */
function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    doc.text('Confidential - For Client Use Only', 105, 285, { align: 'center' });
  }
}

/**
 * Helper function to capitalize first letter
 */
function capitalizeFirstLetter(string: string): string {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}