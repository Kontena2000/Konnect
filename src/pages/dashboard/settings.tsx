import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import editorPreferencesService, { EditorPreferences } from "@/services/editor-preferences";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { ThemeEditor } from "@/components/settings/ThemeEditor";
import { UserManagement } from "@/components/settings/UserManagement";
import { ModuleManager } from "@/components/settings/ModuleManager";
import { EditorSettings } from "@/components/settings/EditorSettings";
import { MatrixCalculatorSettings } from "@/components/settings/MatrixCalculatorSettings";
import { CalculationSettings } from "@/components/settings/CalculationSettings";
import { PricingEditor } from "@/components/settings/PricingEditor";
import { FirebaseMonitor } from "@/components/settings/FirebaseMonitor";
import { DebugSettings } from "@/components/settings/DebugSettings";
import { useRouter } from 'next/router';
import ModelImporter from '@/components/settings/ModelImporter';

export default function SettingsPage() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<EditorPreferences | null>(null);
  const router = useRouter();
  const { tab } = router.query;
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (tab && typeof tab === 'string') {
      setActiveTab(tab);
    }
  }, [tab]);

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
      <div className='container mx-auto py-6 space-y-8'>
        <div className='flex justify-between items-center'>
          <h1 className='text-3xl font-bold'>Settings</h1>
        </div>

        <Tabs defaultValue='general' value={activeTab} onValueChange={setActiveTab} className='mb-4'>
          <TabsList className='mb-4'>
            <TabsTrigger value='general'>General</TabsTrigger>
            <TabsTrigger value='modules'>Modules</TabsTrigger>
            <TabsTrigger value='models'>3D Models</TabsTrigger>
            <TabsTrigger value='editor'>Editor</TabsTrigger>
            <TabsTrigger value='theme'>Theme</TabsTrigger>
            <TabsTrigger value='users'>Users</TabsTrigger>
            <TabsTrigger value='debug'>Debug</TabsTrigger>
          </TabsList>

          <TabsContent value='general'>
            <GeneralSettings userId={user?.uid || ''} />
          </TabsContent>

          <TabsContent value='modules'>
            <ModuleManager userId={user?.uid || ''} userRole={user?.role} />
          </TabsContent>
          
          <TabsContent value='models'>
            <ModelImporter />
          </TabsContent>

          <TabsContent value='editor'>
            <EditorSettings userId={user?.uid || ''} />
          </TabsContent>

          <TabsContent value='theme'>
            <ThemeEditor />
          </TabsContent>

          <TabsContent value='users'>
            <UserManagement />
          </TabsContent>

          <TabsContent value='debug'>
            <DebugSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}