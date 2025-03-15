import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from '@/components/layout/AppLayout';
import { modules, powerCables, networkCables } from "@/components/three/ModuleLibrary";
import { ModuleTemplate } from '@/components/three/ModuleLibrary';

interface ModuleInputProps {
  module: ModuleTemplate;
}

function ModuleInput({ module }: ModuleInputProps) {
  return (
    <Card key={module.id}>
      <CardContent className='pt-6'>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <Label>Name</Label>
            <Input defaultValue={module.name} />
          </div>
          <div>
            <Label>Type</Label>
            <Input defaultValue={module.type} />
          </div>
          <div>
            <Label>Dimensions (m)</Label>
            <Input defaultValue={module.dimensions.join(' x ')} />
          </div>
          <div>
            <Label>Color</Label>
            <Input defaultValue={module.color} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Your email" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select defaultValue="system">
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Layout Grid Size</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue placeholder="Select grid size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (0.5m)</SelectItem>
                      <SelectItem value="medium">Medium (1m)</SelectItem>
                      <SelectItem value="large">Large (2m)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules">
            <Card>
              <CardHeader>
                <CardTitle>Module Management</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Containers and Modules</h3>
                      <div className="space-y-4">
                        {modules.map((module) => (
                          <ModuleInput key={module.id} module={module} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Power Cables</h3>
                      <div className="space-y-4">
                        {powerCables.map((cable) => (
                          <ModuleInput key={cable.id} module={cable} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Network Cables</h3>
                      <div className="space-y-4">
                        {networkCables.map((cable) => (
                          <ModuleInput key={cable.id} module={cable} />
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}