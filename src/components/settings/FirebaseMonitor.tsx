
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Wifi, WifiOff, AlertCircle, CheckCircle2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import firebaseMonitor, { FirebaseStatus, OperationLog } from "@/services/firebase-monitor";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function FirebaseMonitor() {
  const [status, setStatus] = useState<FirebaseStatus>(firebaseMonitor.getStatus());
  const [testing, setTesting] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<number[]>([]);
  const { user } = useAuth();

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

  const handleClearLogs = () => {
    firebaseMonitor.clearLogs();
  };

  const toggleLogExpansion = (index: number) => {
    setExpandedLogs(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case "online":
      case "authenticated":
      case "success":
        return "bg-green-500";
      case "offline":
      case "unauthenticated":
      case "pending":
        return "bg-yellow-500";
      case "error":
      case "unknown":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getOperationIcon = (type: OperationLog['type']) => {
    switch (type) {
      case 'project':
        return '📁';
      case 'module':
        return '🧩';
      case 'category':
        return '📑';
      case 'auth':
        return '🔐';
      case 'connection':
        return '🌐';
      default:
        return '📝';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <CardTitle>Firebase Status Monitor</CardTitle>
            {user && (
              <div className="text-sm text-muted-foreground">
                <div>Current User: {user.email}</div>
                <div>User ID: {user.uid}</div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearLogs}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Logs
            </Button>
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
            <h3 className="text-sm font-medium">Operation Logs</h3>
            <ScrollArea className="h-[400px] rounded-md border">
              <div className="p-4 space-y-2">
                {status.operationLogs.map((log, index) => (
                  <Collapsible
                    key={index}
                    open={expandedLogs.includes(index)}
                    onOpenChange={() => toggleLogExpansion(index)}
                    className="border rounded-md p-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{getOperationIcon(log.type)}</span>
                        <span className="font-medium">{log.type}:{log.action}</span>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {format(log.timestamp, 'HH:mm:ss')}
                        </span>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {expandedLogs.includes(index) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                    <CollapsibleContent className="pt-2">
                      {log.error && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/10 rounded-md">
                          <p className="text-xs text-red-500">{log.error}</p>
                        </div>
                      )}
                      {log.details && (
                        <div className="mt-2 p-2 bg-muted rounded-md">
                          <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                          {log.details.userId && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <div>User ID: {log.details.userId}</div>
                              {log.details.email && <div>Email: {log.details.email}</div>}
                              {log.details.role && <div>Role: {log.details.role}</div>}
                            </div>
                          )}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
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
