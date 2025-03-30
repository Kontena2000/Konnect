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
      <div className='w-full p-4 md:p-6 space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Settings</h1>
            <p className='text-muted-foreground'>
              Manage your application settings and preferences
            </p>
          </div>
        </div>

        <Tabs defaultValue='general' value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
          <TabsList className='w-full'>
            <TabsTrigger value='general'>General</TabsTrigger>
            <TabsTrigger value='theme'>Theme</TabsTrigger>
            <TabsTrigger value='users'>Users</TabsTrigger>
            <TabsTrigger value='modules'>Modules</TabsTrigger>
            <TabsTrigger value='layout-editor'>Layout Editor</TabsTrigger>
            <TabsTrigger value='matrix-calculator'>Matrix Calculator</TabsTrigger>
            <TabsTrigger value='debug'>Debug</TabsTrigger>
          </TabsList>

          <TabsContent value='general' className='space-y-6'>
            <GeneralSettings userId={user?.uid || ''} />
          </TabsContent>

          <TabsContent value='theme' className='space-y-6'>
            <ThemeEditor />
          </TabsContent>

          <TabsContent value='users' className='space-y-6'>
            <UserManagement />
          </TabsContent>

          <TabsContent value='modules' className='space-y-6'>
            <ModuleManager userId={user?.uid || ''} userRole={user?.role} />
          </TabsContent>

          <TabsContent value='layout-editor' className='space-y-6'>
            <EditorSettings userId={user?.uid || ''} />
          </TabsContent>

          <TabsContent value='matrix-calculator' className='space-y-6'>
            <MatrixCalculatorSettings userId={user?.uid || ''} />
            <CalculationSettings readOnly={user?.role !== 'admin'} />
            <PricingEditor readOnly={user?.role !== 'admin'} />
          </TabsContent>

          <TabsContent value='debug' className='space-y-6'>
            <FirebaseMonitor />
            <DebugSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}