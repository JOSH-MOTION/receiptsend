"use client";

import {
  Bell,
  Contact,
  Home,
  Receipt,
  Settings,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useSession, signOut } from 'next-auth/react';
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  icon: Icon,
  children,
  isActive,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30"
          : "text-muted-foreground hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-300"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{children}</span>
      {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isUserLoading = status === 'loading';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState<string>('');

  // Fetch organization name
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch('/api/organization');
        if (response.ok) {
          const data = await response.json();
          setOrganizationName(data.companyName || 'Acme Inc.');
        }
      } catch (error) {
        console.error('Failed to fetch organization:', error);
      }
    };
    
    if (session) {
      fetchOrganization();
    }
  }, [session]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const navigation = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/receipts", icon: Receipt, label: "Receipts" },
    { href: "/contacts", icon: Contact, label: "Contacts" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-black dark:via-slate-900 dark:to-green-950/20">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-72 hidden lg:block">
        <div className="flex h-full flex-col gap-6 bg-white/80 dark:bg-black/40 backdrop-blur-xl border-r border-green-100 dark:border-green-900/50 p-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative  group-hover:shadow-xl transition-all">
              <Image
                src="/logo.png"
                alt="SENDORA"

                width={40}
                height={60}
                className="object-contain p-1"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                SENDORA
              </span>
              <span className="text-xs text-muted-foreground">Digital Receipts</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                isActive={pathname.startsWith(item.href)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User Profile */}
          <div className="border-t border-green-100 dark:border-green-900/50 pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-auto py-3 px-4 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl"
                >
                  {isUserLoading ? (
                    <>
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex flex-col items-start gap-1 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Avatar className="h-10 w-10 border-2 border-green-200 dark:border-green-800">
                        <AvatarImage src={userAvatar?.imageUrl} alt={userAvatar?.description} />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                          {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start flex-1 text-left">
                        <span className="text-sm font-semibold text-foreground">
                          {organizationName || "Loading..."}
                        </span>
                        <span className="text-xs text-muted-foreground truncate w-full">
                          {session?.user?.email}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 backdrop-blur-xl bg-white/90 dark:bg-black/90">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 lg:hidden bg-white/80 dark:bg-black/40 backdrop-blur-xl border-b border-green-100 dark:border-green-900/50">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 p-1.5">
              <Image src="/logo.png" alt="SENDORA" fill className="object-contain p-0.5" priority />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              SENDORA
            </span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hover:bg-green-50 dark:hover:bg-green-900/20">
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-green-100 dark:border-green-900/50 bg-white/95 dark:bg-black/95 backdrop-blur-xl">
            <nav className="p-4 space-y-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  isActive={pathname.startsWith(item.href)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-green-100 dark:border-green-900/50 p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-3">
                    <Avatar className="h-8 w-8 border-2 border-green-200">
                      <AvatarImage src={userAvatar?.imageUrl} />
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                        {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start flex-1 text-left">
                      <span className="text-sm font-semibold">{organizationName || "Loading..."}</span>
                      <span className="text-xs text-muted-foreground">{session?.user?.email}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
                  <DropdownMenuItem>Support</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="lg:pl-72">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Desktop Notifications */}
          <div className="hidden lg:flex justify-end mb-4">
            <Button variant="ghost" size="icon" className="hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
          
          {children}
        </div>
      </main>
    </div>
  );
}