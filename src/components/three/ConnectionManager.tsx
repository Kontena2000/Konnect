import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Power, Network, Snowflake, Droplets, Flame } from "lucide-react";
import { Connection } from "@/types/connection";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const connectionsByType = connections.reduce((acc, connection) => {
    const type = connection.type || 'other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(connection);
    return acc;
  }, {} as Record<string, Connection[]>);
  
  const connectionTypes = Object.keys(connectionsByType);
  
  const getUtilizationPercentage = (connection: Connection) => {
    if (!connection.capacity || !connection.currentLoad) return 0;
    return Math.min(100, (connection.currentLoad / connection.capacity) * 100);
  };
  
  const getUtilizationColor = (percentage: number) => {
    if (percentage > 80) return 'bg-destructive';
    if (percentage > 60) return 'bg-warning';
    return 'bg-success';
  };
  
  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'power': return <Power className='h-4 w-4 text-green-500' />;
      case 'network': return <Network className='h-4 w-4 text-blue-500' />;
      case 'cooling': return <Snowflake className='h-4 w-4 text-cyan-500' />;
      case 'water': return <Droplets className='h-4 w-4 text-sky-500' />;
      case 'gas': return <Flame className='h-4 w-4 text-amber-500' />;
      default: return null;
    }
  };

  const getConnectionUnit = (type: string) => {
    switch (type) {
      case 'power': return 'kW';
      case 'network': return 'Gbps';
      case 'cooling': return 'kW';
      case 'water': return 'm³/h';
      case 'gas': return 'm³/h';
      default: return '';
    }
  };

  if (connections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Connections</CardTitle>
        </CardHeader>
        <CardContent className='text-center py-8 text-muted-foreground'>
          <p>No connections available</p>
          <p className='text-sm mt-2'>Connect modules to create connections</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>Connections</CardTitle>
      </CardHeader>
      <CardContent>
        {connectionTypes.length > 1 ? (
          <Tabs defaultValue={connectionTypes[0] || 'power'}>
            <TabsList className='w-full'>
              {connectionTypes.map(type => (
                <TabsTrigger key={type} value={type} className='capitalize flex gap-2'>
                  {getConnectionIcon(type)}
                  {type}
                  <span className='ml-1 bg-muted px-2 rounded-full text-xs'>
                    {connectionsByType[type].length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {connectionTypes.map(type => (
              <TabsContent key={type} value={type}>
                <ScrollArea className='h-[400px] pr-4'>
                  <div className='space-y-4'>
                    {connectionsByType[type].map((connection) => (
                      <ConnectionItem 
                        key={connection.id}
                        connection={connection}
                        onUpdate={onUpdateConnection}
                        onDelete={onDeleteConnection}
                        icon={getConnectionIcon(type)}
                        unit={getConnectionUnit(type)}
                        getUtilizationPercentage={getUtilizationPercentage}
                        getUtilizationColor={getUtilizationColor}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <ScrollArea className='h-[400px] pr-4'>
            <div className='space-y-4'>
              {connections.map((connection) => (
                <ConnectionItem 
                  key={connection.id}
                  connection={connection}
                  onUpdate={onUpdateConnection}
                  onDelete={onDeleteConnection}
                  icon={getConnectionIcon(connection.type)}
                  unit={getConnectionUnit(connection.type)}
                  getUtilizationPercentage={getUtilizationPercentage}
                  getUtilizationColor={getUtilizationColor}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface ConnectionItemProps {
  connection: Connection;
  onUpdate: (id: string, updates: Partial<Connection>) => void;
  onDelete: (id: string) => void;
  icon: React.ReactNode;
  unit: string;
  getUtilizationPercentage: (connection: Connection) => number;
  getUtilizationColor: (percentage: number) => string;
}

function ConnectionItem({
  connection,
  onUpdate,
  onDelete,
  icon,
  unit,
  getUtilizationPercentage,
  getUtilizationColor
}: ConnectionItemProps) {
  const utilization = getUtilizationPercentage(connection);
  const utilizationColor = getUtilizationColor(utilization);
  
  return (
    <div className='space-y-2 border rounded-md p-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {icon}
          <span className='font-medium'>
            {connection.name || `${connection.type.charAt(0).toUpperCase() + connection.type.slice(1)} Connection`}
          </span>
        </div>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => onDelete(connection.id)}
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>
      
      <div className='space-y-2'>
        <div className='flex justify-between items-center'>
          <Label>Capacity</Label>
          {unit && <span className='text-xs text-muted-foreground'>{unit}</span>}
        </div>
        <Input
          type='number'
          value={connection.capacity || 0}
          onChange={(e) => onUpdate(connection.id, {
            capacity: parseFloat(e.target.value)
          })}
          min={0}
          step={connection.type === 'network' ? 1 : 10}
        />
      </div>
      
      <div className='space-y-2'>
        <div className='flex justify-between items-center'>
          <Label>Current Load</Label>
          <span className='text-xs text-muted-foreground'>
            {connection.currentLoad || 0}/{connection.capacity || 0} {unit}
          </span>
        </div>
        <Input
          type='number'
          value={connection.currentLoad || 0}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            onUpdate(connection.id, { currentLoad: value });
          }}
          min={0}
          step={connection.type === 'network' ? 0.1 : 5}
        />
        
        <Progress 
          value={utilization} 
          className={utilizationColor}
        />
      </div>
      
      {connection.type === 'power' && (
        <div className='space-y-2'>
          <Label>Voltage</Label>
          <Select
            value={connection.voltage || '400'}
            onValueChange={(value) => {
              const typedValue = value as '230' | '400' | '480';
              onUpdate(connection.id, { voltage: typedValue });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select voltage' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='230'>230V</SelectItem>
              <SelectItem value='400'>400V</SelectItem>
              <SelectItem value='480'>480V</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {connection.type === 'network' && (
        <div className='space-y-2'>
          <Label>Network Type</Label>
          <Select
            value={connection.networkType || "ethernet"}
            onValueChange={(value: "ethernet" | "fiber" | "wifi") => 
              onUpdate(connection.id, { networkType: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select network type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ethernet">Ethernet</SelectItem>
              <SelectItem value="fiber">Fiber</SelectItem>
              <SelectItem value="wifi">WiFi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}