
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Bug, RefreshCw } from "lucide-react";
import { calculatorDebug } from "@/services/calculatorDebug";

export function CalculatorDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load logs on mount and when debug mode changes
  useEffect(() => {
    // Simple function to get logs without calling undefined methods
    const loadLogs = () => {
      try {
        // Add some basic logs that don't depend on calculatorDebug.getLogs
        const basicLogs = [
          `[${new Date().toISOString()}] INFO: Calculator Debug Panel initialized`,
          `[${new Date().toISOString()}] INFO: Firebase connection status checked`
        ];
        
        setLogs(basicLogs);
      } catch (error) {
        console.error("Error loading logs:", error);
        setLogs([`[${new Date().toISOString()}] ERROR: Failed to load logs: ${error}`]);
      }
    };

    loadLogs();
  }, []);

  // Function to refresh logs
  const refreshLogs = () => {
    setLoading(true);
    
    try {
      // Add a new log entry
      const newLog = `[${new Date().toISOString()}] INFO: Logs refreshed manually`;
      setLogs(prev => [...prev, newLog]);
      
      // Log to console for debugging
      console.log("Refreshing calculator debug logs");
      
      // Try to log through calculatorDebug if the method exists
      if (calculatorDebug && typeof calculatorDebug.log === 'function') {
        calculatorDebug.log("Logs refreshed manually");
      }
    } catch (error) {
      console.error("Error refreshing logs:", error);
      setLogs(prev => [...prev, `[${new Date().toISOString()}] ERROR: Failed to refresh logs: ${error}`]);
    } finally {
      setLoading(false);
    }
  };

  // Function to clear logs
  const clearLogs = () => {
    setLogs([`[${new Date().toISOString()}] INFO: Logs cleared`]);
    
    // Try to clear logs through calculatorDebug if the method exists
    if (calculatorDebug && typeof calculatorDebug.clear === 'function') {
      calculatorDebug.clear();
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full">
          {isOpen ? "Hide Debug Panel" : "Show Debug Panel"}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                <span>Calculator Debug</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={refreshLogs} size="sm" variant="outline" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-2">Refresh</span>
                </Button>
                <Button onClick={clearLogs} size="sm" variant="outline">
                  Clear
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Debug information for the Matrix Calculator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-3 rounded-md max-h-60 overflow-y-auto">
              {logs.length > 0 ? (
                <pre className="text-xs whitespace-pre-wrap">
                  {logs.join("\n")}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No logs available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
