
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function NavLink({ href, icon, children }: NavLinkProps) {
  const router = useRouter();
  const isActive = router.pathname === href;

  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
