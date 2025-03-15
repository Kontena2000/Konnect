
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Power, Network, Snowflake } from "lucide-react";
import { Connection } from "@/services/layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ConnectionManagerProps {
  connections: Connection[];
  onUpdateConnection: (id: string, updates: Partial<Connection>) => void;
  onDeleteConnection: (id: string) => void;
}

export function ConnectionManager({ 
  connections, 
  onUpdateConnection, 
  onDeleteConnection 
}: ConnectionManagerProps) {
  const getConnectionIcon = (type: string) => {
    switch (type) {
      case "power": return <Power className="h-4 w-4 text-red-500" />;
      case "network": return <Network className="h-4 w-4 text-green-500" />;
      case "cooling": return <Snowflake className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Connections</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {connections.map((connection) => (
              <div key={connection.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getConnectionIcon(connection.type)}
                    <span className="font-medium">
                      {connection.type.charAt(0).toUpperCase() + connection.type.slice(1)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteConnection(connection.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={connection.capacity || 0}
                    onChange={(e) => onUpdateConnection(connection.id, {
                      capacity: parseFloat(e.target.value)
                    })}
                    min={0}
                    step={10}
                  />
                </div>
                <Separator className="my-2" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
