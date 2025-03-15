
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutGrid, 
  FolderOpen, 
  Settings, 
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import authService from "@/services/auth";
import { useIsMobile } from "@/hooks/use-mobile";

export function Sidebar() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(isMobile);

  const handleSignOut = async () => {
    await authService.signOut();
    router.push("/auth/login");
  };

  const navigationItems = [
    {
      title: "Dashboard",
      icon: <LayoutGrid className="h-5 w-5" />,
      href: "/dashboard"
    },
    {
      title: "Projects",
      icon: <FolderOpen className="h-5 w-5" />,
      href: "/dashboard/projects"
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/dashboard/settings"
    }
  ];

  return (
    <div className={`fixed top-0 left-0 h-screen bg-card border-r transition-all duration-200 ${collapsed ? "w-16" : "w-64"}`}>
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && <h1 className="text-lg font-semibold">Kontena</h1>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={collapsed ? "mx-auto" : ""}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="space-y-1 p-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-md hover:bg-accent transition-colors
                ${router.pathname === item.href ? "bg-accent" : ""}
                ${collapsed ? "justify-center" : "space-x-2"}
              `}
            >
              {item.icon}
              {!collapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </div>
        
        <div className="absolute bottom-4 left-0 right-0 p-2">
          <Button
            variant="ghost"
            className={`w-full ${collapsed ? "justify-center" : "justify-start"}`}
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
