"use client";

import {
  Bell,
  Contact,
  Home,
  Receipt,
  Rocket,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useSession, signOut } from 'next-auth/react';
import { Skeleton } from "./ui/skeleton";

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="justify-start"
        tooltip={{ children: <>{children}</>, side: "right" }}
      >
        <Link href={href}>
          <Icon />
          <span>{children}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');
  const { data: session, status } = useSession();
  const router = useRouter();
  const isUserLoading = status === 'loading';

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r">
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Rocket className="w-7 h-7 text-primary" />
            <span className="text-lg font-semibold">ReceiptRocket</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <NavLink href="/dashboard" icon={Home}>
              Dashboard
            </NavLink>
            <NavLink href="/receipts" icon={Receipt}>
              Receipts
            </NavLink>
             <NavLink href="/contacts" icon={Contact}>
              Contacts
            </NavLink>
            <NavLink href="/settings" icon={Settings}>
              Settings
            </NavLink>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 px-2">
                  {isUserLoading ? (
                    <>
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex flex-col items-start gap-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userAvatar?.imageUrl} alt={userAvatar?.description} data-ai-hint={userAvatar?.imageHint} />
                        <AvatarFallback>
                          {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold">
                          {(session?.user as any)?.name || "Acme Inc."}
                        </span>
                        <span className="text-xs text-muted-foreground -mt-0.5">{session?.user?.email}</span>
                      </div>
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="sm:hidden" />
          <div className="flex-1">
            {/* Breadcrumbs can be added here */}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}