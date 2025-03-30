import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  FolderOpen, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Edit,
  Calculator
} from 'lucide-react';
import authService from '@/services/auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

export function Sidebar({ className }: { className?: string }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(isMobile);
  const { role } = useAuth();

  const handleSignOut = async () => {
    await authService.signOut();
    router.push('/auth/login');
  };

  const navigationItems = [
    {
      title: 'Projects',
      icon: <FolderOpen className='h-5 w-5' />,
      href: '/dashboard/projects'
    },
    {
      title: 'Layout Editor',
      icon: <Edit className='h-5 w-5' />,
      href: '/dashboard/editor'
    },
    {
      title: 'Matrix Calculator',
      icon: <Calculator className='h-5 w-5' />,
      href: '/dashboard/matrix-calculator',
      beta: true
    },
    {
      title: 'Settings',
      icon: <Settings className='h-5 w-5' />,
      href: '/dashboard/settings'
    }
  ];

  return (
    <div className={cn("pb-12 border-r h-full", className)}>
      <div className={cn(
        "fixed top-0 left-0 h-screen bg-white border-r shadow-sm transition-all duration-300 ease-in-out z-50",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <div className={cn("flex items-center", collapsed && "justify-center w-full")}>
            <Image
              src="/logo-m8cuqi6n.svg"
              alt="Kontena Logo"
              width={collapsed ? 32 : 120}
              height={collapsed ? 32 : 32}
              priority
              className="transition-all duration-300"
            />
          </div>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="text-black hover:bg-primary/10 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <ScrollArea className='h-[calc(100vh-4rem)] px-2'>
          <nav className='space-y-1 py-2'>
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 rounded-md text-black transition-colors relative',
                  'hover:bg-primary/10',
                  router.pathname === item.href && 'bg-primary/20',
                  collapsed ? 'justify-center' : 'space-x-2'
                )}
              >
                {item.icon}
                {!collapsed && (
                  <>
                    <span>{item.title}</span>
                    {item.beta && (
                      <span className='ml-2 text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800'>
                        Beta
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.beta && (
                  <span className='absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400'></span>
                )}
              </Link>
            ))}
          </nav>
          
          <div className="absolute bottom-4 left-0 right-0 p-2">
            <Button
              variant="ghost"
              className={cn(
                "w-full text-black hover:bg-primary/10 transition-colors",
                collapsed ? "justify-center" : "justify-start"
              )}
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        </ScrollArea>
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-black hover:bg-primary/10 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}