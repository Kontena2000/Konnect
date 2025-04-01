import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { generateCalculationPdfReport } from "@/services/calculatorReportPdfService";
import { CalculationConfig, CalculationOptions } from "@/services/matrixCalculatorService";
import { useToast } from "@/hooks/use-toast";

interface GeneratePdfButtonProps {
  config: CalculationConfig;
  results: any;
  options: CalculationOptions;
  projectName?: string;
  clientName?: string;
}

export function GeneratePdfButton({
  config,
  results,
  options,
  projectName,
  clientName
}: GeneratePdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGeneratePdf = async () => {
    try {
      setIsGenerating(true);
      
      // Generate the PDF report
      const pdfBlob = await generateCalculationPdfReport(
        config,
        results,
        options,
        {
          includeFormulas: true,
          includeDetailedBreakdown: true,
          projectName: projectName || "Data Center Project",
          clientName: clientName || "",
          date: new Date().toLocaleDateString(),
        }
      );
      
      // Create a download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${projectName || "DataCenter"}_Report.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Report Generated",
        description: "Your detailed calculation report has been downloaded.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error Generating PDF",
        description: "There was a problem generating the PDF report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGeneratePdf}
      disabled={isGenerating || !results}
      className="flex items-center gap-2"
    >
      <FileText className="h-4 w-4" />
      {isGenerating ? "Generating..." : "Full Report"}
    </Button>
  );
}
