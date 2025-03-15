
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MessageSquare } from "lucide-react";

interface ViewCommentsProps {
  layoutId: string;
}

export function ViewComments({ layoutId }: ViewCommentsProps) {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isCreating ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          ) : (
            <div className="space-y-2">
              <Input placeholder="Title" />
              <Textarea placeholder="Your comment..." />
              <div className="flex gap-2">
                <Button size="sm">Save</Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* Example comments */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 mt-1" />
                <div>
                  <div className="font-medium">Cooling capacity concern</div>
                  <p className="text-sm text-muted-foreground">
                    Please verify if the cooling capacity is sufficient for the expanded data center area.
                  </p>
                  <div className="text-xs text-muted-foreground mt-1">
                    John Doe • 2 hours ago
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
