import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Project } from "@/services/project";
import { Layout } from "@/services/layout";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import html2canvas from "html2canvas";

// Add the autotable plugin type to jsPDF
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ProjectReportOptions {
  includeLayouts?: boolean;
  includeCalculations?: boolean;
  companyName?: string;
  preparedBy?: string;
  date?: string;
  logo?: string;
}

/**
 * Generate a comprehensive PDF report for a project
 */
export async function generateProjectPdfReport(
  project: Project,
  layouts: Layout[],
  calculations: any[],
  layoutImages: { [key: string]: string } = {},
  options: ProjectReportOptions = {}
): Promise<Blob> {
  try {
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Default report options
    const defaultReportOptions: ProjectReportOptions = {
      includeLayouts: true,
      includeCalculations: true,
      companyName: "Kontena",
      preparedBy: "",
      date: new Date().toLocaleDateString(),
    };

    // Merge default options with provided options
    const finalOptions = { ...defaultReportOptions, ...options };

    // Add report header
    addReportHeader(doc, project, finalOptions);

    // Add project details
    const projectDetailsY = addProjectDetails(doc, project);

    // Add client information
    const clientInfoY = addClientInformation(doc, project, projectDetailsY);

    // Add layouts section if requested
    let currentY = clientInfoY;
    if (finalOptions.includeLayouts && layouts.length > 0) {
      currentY = await addLayoutsSection(doc, layouts, layoutImages, currentY);
    }

    // Add calculations section if requested
    if (finalOptions.includeCalculations && calculations.length > 0) {
      currentY = addCalculationsSection(doc, calculations, currentY);
    }

    // Add footer with page numbers
    addFooter(doc, project);

    // Return the PDF as a blob
    return doc.output("blob");
  } catch (error) {
    console.error("Error generating project report:", error);
    throw new Error(`Failed to generate project report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Add the report header with company info and project details
 */
function addReportHeader(doc: jsPDF, project: Project, options: ProjectReportOptions) {
  try {
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
    doc.text("Project Report", 105, 20, { align: "center" });

    // Add company and project info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Company: ${options.companyName}`, 105, 30, { align: "center" });
    doc.text(`Project: ${project.name}`, 105, 36, { align: "center" });

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

    // Move to next section
    doc.setFontSize(12);
  } catch (error) {
    console.error("Error adding report header:", error);
  }
}

/**
 * Add project details section
 */
function addProjectDetails(doc: jsPDF, project: Project): number {
  try {
    const startY = 60;
    
    // Section title
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Project Details", 15, startY);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    // Format dates
    const createdDate = project.createdAt 
      ? new Date((project.createdAt as any)?.seconds * 1000 || Date.now()).toLocaleDateString() 
      : 'Unknown';
    
    const updatedDate = project.updatedAt 
      ? new Date((project.updatedAt as any)?.seconds * 1000 || Date.now()).toLocaleDateString() 
      : 'Unknown';
    
    // Create project details table
    const tableData = [
      ["Project Name", project.name],
      ["Description", project.description || "No description provided"],
      ["Status", project.status || "Planning"],
      ["Created", createdDate],
      ["Last Updated", updatedDate]
    ];
    
    // Add shared with information if available
    if (project.sharedWith && project.sharedWith.length > 0) {
      tableData.push(["Shared With", project.sharedWith.join(", ")]);
    }
    
    doc.autoTable({
      startY: startY + 5,
      head: [["Property", "Value"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
      styles: { fontSize: 10 },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 130 }
      }
    });
    
    // Return the Y position after the table
    return doc.autoTable.previous.finalY + 15;
  } catch (error) {
    console.error("Error adding project details:", error);
    return 120; // Return a default value if there's an error
  }
}

/**
 * Add client information section
 */
function addClientInformation(doc: jsPDF, project: Project, startY: number): number {
  try {
    // Section title
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Client Information", 15, startY);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    // Check if client info exists
    if (!project.clientInfo) {
      doc.text("No client information available", 15, startY + 10);
      return startY + 20;
    }
    
    // Create client info table
    const tableData = [
      ["Company Name", project.clientInfo.name || "Not specified"],
      ["Email", project.clientInfo.email || "Not specified"],
      ["Phone", project.clientInfo.phone || "Not specified"],
      ["Address", project.clientInfo.address || "Not specified"]
    ];
    
    doc.autoTable({
      startY: startY + 5,
      head: [["Property", "Value"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
      styles: { fontSize: 10 },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 130 }
      }
    });
    
    // Return the Y position after the table
    return doc.autoTable.previous.finalY + 15;
  } catch (error) {
    console.error("Error adding client information:", error);
    return startY + 30; // Return a default value if there's an error
  }
}

/**
 * Add layouts section with images
 */
async function addLayoutsSection(doc: jsPDF, layouts: Layout[], layoutImages: { [key: string]: string }, startY: number): Promise<number> {
  try {
    // Check if we need to add a new page
    if (startY > 220) {
      doc.addPage();
      startY = 20;
    }
    
    // Section title
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Project Layouts", 15, startY);
    
    return await addLayoutDetails(doc, layouts, layoutImages, startY + 10);
  } catch (error) {
    console.error("Error adding layouts section:", error);
    return startY + 20; // Return a default value if there's an error
  }
}

/**
 * Add layout details and images
 */
async function addLayoutDetails(doc: jsPDF, layouts: Layout[], layoutImages: { [key: string]: string }, startY: number): Promise<number> {
  try {
    let currentY = startY;
    
    for (let i = 0; i < layouts.length; i++) {
      const layout = layouts[i];
      
      // Check if we need to add a new page
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }
      
      // Add layout title
      doc.setFontSize(14);
      doc.setTextColor(0, 71, 122);
      doc.text(`Layout: ${layout.name}`, 15, currentY);
      currentY += 6;
      
      // Add layout description if available
      if (layout.description) {
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Description: ${layout.description}`, 15, currentY);
        currentY += 6;
      }
      
      // Add layout details
      doc.setFontSize(10);
      doc.text(`Modules: ${layout.modules?.length || 0}`, 15, currentY);
      currentY += 5;
      doc.text(`Connections: ${layout.connections?.length || 0}`, 15, currentY);
      currentY += 5;
      
      // Add last updated info
      if (layout.updatedAt) {
        const updatedDate = new Date((layout.updatedAt as any)?.seconds * 1000 || Date.now()).toLocaleDateString();
        doc.text(`Last updated: ${updatedDate}`, 15, currentY);
        currentY += 10;
      }
      
      // Add layout image if available
      if (layoutImages[layout.id]) {
        try {
          // Add the image
          doc.addImage(layoutImages[layout.id], "JPEG", 15, currentY, 180, 100);
          currentY += 110; // Image height + margin
        } catch (error) {
          console.error(`Error adding layout image for ${layout.id}:`, error);
          doc.text("Layout image could not be loaded", 15, currentY);
          currentY += 10;
        }
      } else {
        doc.text("No layout image available", 15, currentY);
        currentY += 10;
      }
      
      // Add separator between layouts
      if (i < layouts.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(15, currentY, 195, currentY);
        currentY += 15;
      }
    }
    
    return currentY;
  } catch (error) {
    console.error("Error adding layout details:", error);
    return startY + 30; // Return a default value if there's an error
  }
}

/**
 * Add calculations section
 */
function addCalculationsSection(doc: jsPDF, calculations: any[], startY: number): number {
  try {
    // Check if we need to add a new page
    if (startY > 220) {
      doc.addPage();
      startY = 20;
    }
    
    // Section title
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("Project Calculations", 15, startY);
    
    return addCalculationDetails(doc, calculations, startY + 10);
  } catch (error) {
    console.error("Error adding calculations section:", error);
    return startY + 20; // Return a default value if there's an error
  }
}

/**
 * Add calculation details
 */
function addCalculationDetails(doc: jsPDF, calculations: any[], startY: number): number {
  try {
    let currentY = startY;
    
    for (let i = 0; i < calculations.length; i++) {
      const calculation = calculations[i];
      
      // Check if we need to add a new page
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }
      
      // Add calculation title
      doc.setFontSize(14);
      doc.setTextColor(0, 71, 122);
      doc.text(`Calculation: ${calculation.name || 'Untitled Calculation'}`, 15, currentY);
      currentY += 6;
      
      // Add calculation description if available
      if (calculation.description) {
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Description: ${calculation.description}`, 15, currentY);
        currentY += 10;
      } else {
        currentY += 4;
      }
      
      // Add configuration summary
      doc.setFontSize(12);
      doc.setTextColor(0, 51, 102);
      doc.text("Configuration Summary", 15, currentY);
      currentY += 6;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const coolingTypeText = calculation.coolingType === 'dlc' ? 'Direct Liquid Cooling' : 
                              calculation.coolingType === 'air' ? 'Air Cooling' : 
                              calculation.coolingType === 'hybrid' ? 'Hybrid Cooling' : 'Immersion Cooling';
      
      doc.text(`Power Density: ${calculation.kwPerRack || 0} kW per rack`, 15, currentY);
      currentY += 5;
      doc.text(`Cooling Type: ${coolingTypeText}`, 15, currentY);
      currentY += 5;
      doc.text(`Total Racks: ${calculation.totalRacks || 0}`, 15, currentY);
      currentY += 10;
      
      // Add results if available
      if (calculation.results) {
        // Cost information
        if (calculation.results.cost) {
          doc.setFontSize(12);
          doc.setTextColor(0, 51, 102);
          doc.text("Cost Summary", 15, currentY);
          currentY += 6;
          
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          
          try {
            const totalCost = calculation.results.cost.totalProjectCost;
            doc.text(`Total Project Cost: ${formatCurrency(totalCost)}`, 15, currentY);
            currentY += 5;
            
            if (calculation.results.cost.costPerRack) {
              doc.text(`Cost per Rack: ${formatCurrency(calculation.results.cost.costPerRack)}`, 15, currentY);
              currentY += 5;
            }
            
            if (calculation.results.cost.costPerKw) {
              doc.text(`Cost per kW: ${formatCurrency(calculation.results.cost.costPerKw)}`, 15, currentY);
              currentY += 10;
            } else {
              currentY += 5;
            }
          } catch (error) {
            console.error("Error formatting cost data:", error);
            doc.text("Cost data could not be displayed", 15, currentY);
            currentY += 10;
          }
        }
        
        // Power requirements
        if (calculation.results.power) {
          doc.setFontSize(12);
          doc.setTextColor(0, 51, 102);
          doc.text("Power Requirements", 15, currentY);
          currentY += 6;
          
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          
          try {
            const powerValue = calculation.results.power.upsCapacity ? 
              formatNumber(calculation.results.power.upsCapacity) : 
              calculation.results.power.totalPower ? 
                formatNumber(calculation.results.power.totalPower) : '0';
            
            doc.text(`Power Capacity: ${powerValue} kW`, 15, currentY);
            currentY += 5;
            
            if (calculation.results.power.upsModules) {
              doc.text(`UPS Modules: ${calculation.results.power.upsModules} x ${calculation.results.power.upsModuleSize || 250}kW`, 15, currentY);
              currentY += 5;
            }
            
            if (calculation.results.power.redundancy) {
              doc.text(`Redundancy: ${calculation.results.power.redundancy}`, 15, currentY);
              currentY += 10;
            } else {
              currentY += 5;
            }
          } catch (error) {
            console.error("Error formatting power data:", error);
            doc.text("Power data could not be displayed", 15, currentY);
            currentY += 10;
          }
        }
        
        // Cooling solution
        if (calculation.results.cooling) {
          doc.setFontSize(12);
          doc.setTextColor(0, 51, 102);
          doc.text("Cooling Solution", 15, currentY);
          currentY += 6;
          
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          
          try {
            let coolingCapacityText = "";
            
            if (calculation.coolingType === 'hybrid') {
              coolingCapacityText = `${formatNumber(calculation.results.cooling.dlcCapacity || 0)} kW DLC + ${formatNumber(calculation.results.cooling.airCapacity || 0)} kW Air`;
            } else {
              coolingCapacityText = `${formatNumber(calculation.results.cooling.coolingCapacity || calculation.results.cooling.totalCapacity || 0)} kW`;
            }
            
            doc.text(`Cooling Capacity: ${coolingCapacityText}`, 15, currentY);
            currentY += 5;
            
            if (calculation.results.cooling.flowRate) {
              doc.text(`Flow Rate: ${formatNumber(calculation.results.cooling.flowRate)} L/min`, 15, currentY);
              currentY += 10;
            } else {
              currentY += 5;
            }
          } catch (error) {
            console.error("Error formatting cooling data:", error);
            doc.text("Cooling data could not be displayed", 15, currentY);
            currentY += 10;
          }
        }
      }
      
      // Add separator between calculations
      if (i < calculations.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(15, currentY, 195, currentY);
        currentY += 15;
      }
    }
    
    return currentY;
  } catch (error) {
    console.error("Error adding calculation details:", error);
    return startY + 30; // Return a default value if there's an error
  }
}

/**
 * Add footer with page numbers and project name
 */
function addFooter(doc: jsPDF, project: Project) {
  try {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text(`Project: ${project.name} - Confidential`, 105, 285, { align: 'center' });
    }
  } catch (error) {
    console.error("Error adding footer:", error);
  }
}

/**
 * Capture layout image from DOM element
 */
export async function captureLayoutImage(elementId: string): Promise<string> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID ${elementId} not found`);
    }
    
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      logging: false,
      useCORS: true,
      allowTaint: true
    });
    
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Error capturing layout image:', error);
    throw error;
  }
}