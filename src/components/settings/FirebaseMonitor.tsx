
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Wifi, WifiOff, AlertCircle, CheckCircle2 } from "lucide-react";
import firebaseMonitor, { FirebaseStatus } from "@/services/firebase-monitor";

export function FirebaseMonitor() {
  const [status, setStatus] = useState<FirebaseStatus>(firebaseMonitor.getStatus());
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    return firebaseMonitor.subscribe(setStatus);
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      await firebaseMonitor.testConnection();
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case "online":
      case "authenticated":
        return "bg-green-500";
      case "offline":
      case "unauthenticated":
        return "bg-yellow-500";
      case "error":
      case "unknown":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Firebase Status Monitor</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleTestConnection}
            disabled={testing}
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">Connection Status</h3>
                {status.isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <Badge className={getStatusColor(status.connectionState)}>
                {status.connectionState}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">Authentication Status</h3>
                {status.authState === "authenticated" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <Badge className={getStatusColor(status.authState)}>
                {status.authState}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Last Operation</h3>
            <p className="text-sm text-muted-foreground">
              {status.lastOperation || "No operations recorded"}
            </p>
            <p className="text-xs text-muted-foreground">
              {status.timestamp ? new Date(status.timestamp).toLocaleString() : ""}
            </p>
          </div>

          {status.lastError && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-red-500">Last Error</h3>
              <ScrollArea className="h-20 rounded-md border p-2">
                <p className="text-sm text-red-500">{status.lastError}</p>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
