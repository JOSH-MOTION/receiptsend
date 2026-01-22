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
  LogOut,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { doc } from "firebase/firestore";

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
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";
import { useUser, useFirebase, useDoc, useMemoFirebase, useAuth as useFirebaseAuth } from "@/firebase";
import { signOut } from "firebase/auth";


function NavLink({
  href,
  icon: Icon,
  children,
  isActive,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30"
          : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
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
  const { user, isUserLoading } = useUser();
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch organization name using useDoc
  const orgRef = useMemoFirebase(() => user ? doc(firestore, 'organizations', user.uid) : null, [firestore, user]);
  const { data: organization, isLoading: isOrgLoading } = useDoc(orgRef);


  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  // Close mobile menu when clicking a nav link
  const handleNavLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const navigation = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/receipts", icon: Receipt, label: "Receipts" },
    { href: "/contacts", icon: Contact, label: "Contacts" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  const organizationName = organization?.companyName || "My Organization";

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-72 hidden lg:block">
        <div className="flex h-full flex-col gap-6 bg-card/80 backdrop-blur-xl border-r border-border p-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative group-hover:shadow-xl transition-all">
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
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
          <div className="border-t border-border pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-auto py-3 px-4 hover:bg-secondary rounded-xl"
                >
                  {isUserLoading || isOrgLoading ? (
                    <>
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex flex-col items-start gap-1 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Avatar className="h-10 w-10 border-2 border-secondary">
                        <AvatarImage src={userAvatar?.imageUrl} alt={userAvatar?.description} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                          {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start flex-1 text-left">
                        <span className="text-sm font-semibold text-foreground">
                          {organizationName}
                        </span>
                        <span className="text-xs text-muted-foreground truncate w-full">
                          {user?.email}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 backdrop-blur-xl bg-card/90">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 lg:hidden bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent p-1.5">
              <Image src="/logo.png" alt="SENDORA" fill className="object-contain p-0.5" priority />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SENDORA
            </span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-border bg-card/95 backdrop-blur-xl">
            <nav className="p-4 space-y-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  isActive={pathname.startsWith(item.href)}
                  onClick={handleNavLinkClick}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-border p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-3">
                    <Avatar className="h-8 w-8 border-2 border-secondary">
                      <AvatarImage src={userAvatar?.imageUrl} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start flex-1 text-left">
                      <span className="text-sm font-semibold">{organizationName}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
                  <DropdownMenuItem>Support</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive flex items-center gap-2">
                    <LogOut className="h-4 w-4"/>
                    Logout
                  </DropdownMenuItem>
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
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
          
          {children}
        </div>
      </main>
    </div>
  );
}
