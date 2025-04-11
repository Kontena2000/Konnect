
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
    lastAutoTable?: {
      finalY: number;
    };
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
 * Generate a simplified PDF report for a project
 * Focusing on project name, description, status and client information
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
      includeLayouts: false,
      includeCalculations: false,
      companyName: "Kontena",
      preparedBy: "",
      date: new Date().toLocaleDateString(),
    };

    // Merge default options with provided options
    const finalOptions = { ...defaultReportOptions, ...options };

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102); // Dark blue
    doc.text("PROJECT REPORT", 105, 25, { align: "center" });

    // Add date
    doc.setFontSize(10);
    doc.text(`Date: ${finalOptions.date}`, 195, 20, { align: "right" });
    
    // Add horizontal line
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(15, 40, 195, 40);

    // Add project details in a table format
    addProjectDetailsTable(doc, project);

    // Add client information in a table format
    addClientInformationTable(doc, project);

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
 * Add project details in a table format
 */
function addProjectDetailsTable(doc: jsPDF, project: Project): void {
  try {
    const startY = 60;
    
    // Project details table data
    const tableData = [
      ["Project Name", project.name || "Untitled Project"],
      ["Description", project.description || "No description provided"],
      ["Status", project.status || "Planning"]
    ];
    
    doc.autoTable({
      startY: startY,
      body: tableData,
      theme: "plain", // Use plain theme for borderless table
      styles: { 
        fontSize: 11,
        cellPadding: 5
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: "bold" },
        1: { cellWidth: 120 }
      }
    });
  } catch (error) {
    console.error("Error adding project details table:", error);
  }
}

/**
 * Add client information in a table format
 */
function addClientInformationTable(doc: jsPDF, project: Project): void {
  try {
    // Get the Y position after the previous table
    const startY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 20 : 120;
    
    // Check if client info exists
    if (!project.clientInfo) {
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("No client information available", 15, startY);
      return;
    }
    
    // Client information table data
    const tableData = [
      ["Company Name", project.clientInfo.name || "Not specified"],
      ["Email", project.clientInfo.email || "Not specified"],
      ["Phone", project.clientInfo.phone || "Not specified"],
      ["Address", project.clientInfo.address || "Not specified"]
    ];
    
    doc.autoTable({
      startY: startY,
      body: tableData,
      theme: "plain", // Use plain theme for borderless table
      styles: { 
        fontSize: 11,
        cellPadding: 5
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: "bold" },
        1: { cellWidth: 120 }
      }
    });
  } catch (error) {
    console.error("Error adding client information table:", error);
  }
}

/**
 * Add footer with page numbers and project name
 */
function addFooter(doc: jsPDF, project: Project): void {
  try {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
      doc.text(`Project: ${project.name || "Untitled Project"} - Confidential`, 105, 285, { align: "center" });
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
    
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch (error) {
    console.error("Error capturing layout image:", error);
    throw error;
  }
}
