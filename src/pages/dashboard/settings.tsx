import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleManager } from "@/components/settings/ModuleManager";
import { ThemeEditor } from "@/components/settings/ThemeEditor";
import { FirebaseMonitor } from "@/components/settings/FirebaseMonitor";
import editorPreferencesService, { EditorPreferences } from "@/services/editor-preferences";
import { EditorSettings } from '@/components/settings/EditorSettings';

export default function SettingsPage() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<EditorPreferences | null>(null);

  useEffect(() => {
    if (user) {
      editorPreferencesService.getPreferences(user.uid)
        .then(prefs => {
          setPreferences(prefs);
        })
        .catch(error => {
          console.error("Failed to load editor preferences:", error);
        });
    }
  }, [user]);

  return (
    <AppLayout>
      <div className='w-full p-4 md:p-6 space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Settings</h1>
            <p className='text-muted-foreground'>
              Manage your application settings and preferences
            </p>
          </div>
        </div>

        <Tabs defaultValue='editor' className='space-y-6'>
          <TabsList className='w-full sm:w-auto'>
            <TabsTrigger value='editor'>Editor Settings</TabsTrigger>
            <TabsTrigger value='modules'>Module Manager</TabsTrigger>
            <TabsTrigger value='theme'>Theme Editor</TabsTrigger>
            <TabsTrigger value='firebase'>Firebase Monitor</TabsTrigger>
          </TabsList>

          <TabsContent value="editor">
            <Card>
              <CardHeader>
                <CardTitle>Editor Settings</CardTitle>
                <CardDescription>Customize your editor experience</CardDescription>
              </CardHeader>
              <CardContent>
                {preferences && (
                  <EditorSettings
                    preferences={preferences}
                    onUpdate={setPreferences}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules">
            <ModuleManager />
          </TabsContent>

          <TabsContent value="theme">
            <ThemeEditor />
          </TabsContent>

          <TabsContent value="firebase">
            <FirebaseMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}