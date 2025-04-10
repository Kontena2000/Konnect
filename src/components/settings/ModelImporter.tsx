import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import modelImporterService, { ModelAsset, ImportedModel } from "@/services/modelImporter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, Check, X, RefreshCw } from "lucide-react";

export default function ModelImporter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("");
  const [searchResults, setSearchResults] = useState<ModelAsset[]>([]);
  const [importedModels, setImportedModels] = useState<ImportedModel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("search");

  // Categories for the dropdown
  const categories = [
    { value: "", label: "All Categories" },
    { value: "plants", label: "Plants" },
    { value: "furniture", label: "Furniture" },
    { value: "electronics", label: "Electronics" },
    { value: "vehicles", label: "Vehicles" },
    { value: "architecture", label: "Architecture" },
    { value: "food", label: "Food" },
    { value: "household", label: "Household" },
  ];

  // Load user's imported models
  useEffect(() => {
    if (user) {
      loadImportedModels();
    }
  }, [user]);

  const loadImportedModels = async () => {
    if (!user?.uid) return;
    
    try {
      const models = await modelImporterService.getUserModels(user.uid);
      setImportedModels(models);
    } catch (error) {
      console.error("Error loading imported models:", error);
      toast({
        title: "Error",
        description: "Failed to load your imported models",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const results = await modelImporterService.searchModels({
        query: searchQuery,
        category,
        limit: 20,
      });
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: "Could not retrieve models from Poly Haven",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (model: ModelAsset) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please log in to import models",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(prev => ({ ...prev, [model.id]: true }));
    
    try {
      const importedModel = await modelImporterService.importModel(
        model.id,
        "glb",
        user.uid
      );
      
      setImportedModels(prev => [importedModel, ...prev]);
      
      toast({
        title: "Model Imported",
        description: `Successfully imported ${model.name}`,
        variant: "default",
      });
      
      // Switch to the library tab
      setActiveTab("library");
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: error?.message || "Could not import the model",
        variant: "destructive",
      });
    } finally {
      setIsImporting(prev => ({ ...prev, [model.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">3D Model Importer</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadImportedModels}
          disabled={!user}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search Models</TabsTrigger>
          <TabsTrigger value="library">My Library</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Poly Haven</CardTitle>
              <CardDescription>
                Find 3D models to import into your projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search for models..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isSearching ? (
              // Loading skeletons
              Array(6)
                .fill(0)
                .map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-0">
                      <Skeleton className="h-40 w-full rounded-t-lg" />
                      <div className="p-4">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : searchResults.length > 0 ? (
              // Search results
              searchResults.map((model) => (
                <Card key={model.id}>
                  <CardContent className="p-0">
                    <div className="relative h-40 w-full">
                      <img
                        src={model.thumbnailUrl || "/placeholder-model.png"}
                        alt={model.name}
                        className="h-full w-full object-cover rounded-t-lg"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-model.png";
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium">{model.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {Array.isArray(model.category) 
                          ? model.category.join(", ") 
                          : model.category}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleImport(model)}
                      disabled={isImporting[model.id]}
                    >
                      {isImporting[model.id] ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Import
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              // No results or initial state
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No models found. Try a different search term or category."
                    : "Search for models to get started."}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="library" className="space-y-4">
          {!user ? (
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <p className="text-muted-foreground">
                  Please log in to view your imported models
                </p>
              </CardContent>
            </Card>
          ) : importedModels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {importedModels.map((model) => (
                <Card key={model.id}>
                  <CardContent className="p-0">
                    <div className="relative h-40 w-full">
                      <img
                        src={model.thumbnailUrl || "/placeholder-model.png"}
                        alt={model.name}
                        className="h-full w-full object-cover rounded-t-lg"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-model.png";
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium">{model.name}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-muted-foreground">
                          {model.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {model.importDate.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="default" size="sm">
                      Use in Editor
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven't imported any models yet
                </p>
                <Button onClick={() => setActiveTab("search")}>
                  <Search className="h-4 w-4 mr-2" />
                  Search for Models
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}