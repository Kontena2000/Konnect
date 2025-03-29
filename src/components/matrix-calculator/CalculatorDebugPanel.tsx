import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { calculatorDebug, verifyCalculatorServices, checkFirebaseInitialization } from "@/services/calculatorDebug";

export function CalculatorDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [serviceStatus, setServiceStatus] = useState<{
    firebase: boolean;
    services: { success: boolean; missingServices: string[] };
  }>({
    firebase: false,
    services: { success: false, missingServices: [] }
  });

  useEffect(() => {
    // Override console.log to capture calculator debug logs
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      originalConsoleLog(...args);
      if (typeof args[0] === 'string' && args[0].includes('[Calculator')) {
        setLogs(prev => [...prev, args.join(' ')].slice(-50)); // Keep last 50 logs
      }
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      if (typeof args[0] === 'string' && args[0].includes('[Calculator')) {
        setLogs(prev => [...prev, `ERROR: ${args.join(' ')}`].slice(-50)); // Keep last 50 logs
      }
    };

    // Check services
    const firebaseStatus = checkFirebaseInitialization();
    const servicesStatus = verifyCalculatorServices();
    
    setServiceStatus({
      firebase: firebaseStatus,
      services: servicesStatus
    });

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const toggleDebug = () => {
    calculatorDebug.enabled = !calculatorDebug.enabled;
    setLogs(prev => [...prev, `[Calculator Debug] Debug mode ${calculatorDebug.enabled ? 'enabled' : 'disabled'}`]);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          {isOpen ? "Hide Debug Panel" : "Show Debug Panel"}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-2">
          <CardHeader className="py-2">
            <CardTitle className="text-sm flex justify-between items-center">
              <span>Calculator Debug</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={toggleDebug}>
                  {calculatorDebug.enabled ? "Disable Debug" : "Enable Debug"}
                </Button>
                <Button variant="outline" size="sm" onClick={clearLogs}>
                  Clear Logs
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h4 className="font-medium mb-2">Service Status:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${serviceStatus.firebase ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Firebase: {serviceStatus.firebase ? 'Connected' : 'Not Connected'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${serviceStatus.services.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Calculator Services: {serviceStatus.services.success ? 'Available' : 'Issues Detected'}</span>
                </div>
              </div>
              
              {serviceStatus.services.missingServices.length > 0 && (
                <div className="mt-2 text-sm text-red-500">
                  <p>Missing services:</p>
                  <ul className="list-disc pl-5">
                    {serviceStatus.services.missingServices.map((service, i) => (
                      <li key={i}>{service}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <h4 className="font-medium mb-2">Debug Logs:</h4>
            <div className="bg-muted p-2 rounded-md h-40 overflow-y-auto text-xs font-mono">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No logs yet. Run a calculation to see debug output.</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`${log.includes('ERROR') ? 'text-red-500' : ''}`}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
