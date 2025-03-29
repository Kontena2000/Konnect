import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import editorPreferencesService, { EditorPreferences } from "@/services/editor-preferences";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { LayoutEditorSettings } from "@/components/settings/LayoutEditorSettings";
import { MatrixCalculatorSettings } from "@/components/settings/MatrixCalculatorSettings";
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
      <div className="w-full p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your application settings and preferences
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="layout-editor">Layout Editor</TabsTrigger>
            <TabsTrigger value="matrix-calculator">Matrix Calculator</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            {user && <GeneralSettings userId={user.uid} />}
          </TabsContent>

          <TabsContent value="layout-editor">
            {preferences && user && (
              <LayoutEditorSettings
                preferences={preferences}
                onUpdate={setPreferences}
                userId={user.uid}
              />
            )}
          </TabsContent>

          <TabsContent value="matrix-calculator">
            {user && <MatrixCalculatorSettings userId={user.uid} />}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}