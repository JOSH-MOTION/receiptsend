"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Building, Palette, Save, Loader2,Building2, Upload } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";


interface Organization {
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  thankYouMessage?: string;
  logoUrl?: string;
}

export default function SettingsPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [organization, setOrganization] = useState<Partial<Organization>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const orgRef = useMemoFirebase(() => (user ? doc(firestore, `organizations/${user.uid}`) : null), [firestore, user]);
  const { data: orgData, isLoading } = useDoc<Organization>(orgRef);

  useEffect(() => {
    if (orgData) {
      setOrganization(orgData);
    }
  }, [orgData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrganization(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (section: 'profile' | 'branding') => {
    if (!user || !orgRef) return;
    setSavingSection(section);

    let payload: Partial<Organization> = {};
    if (section === 'profile') {
      payload = {
        companyName: organization.companyName, 
        email: organization.email,
        phoneNumber: organization.phoneNumber,
        address: organization.address
      };
    } else if (section === 'branding') {
      payload = {
        thankYouMessage: organization.thankYouMessage,
      };
      if (logoPreview) {
        payload.logoUrl = logoPreview;
      }
    }
    
    try {
      await updateDoc(orgRef, payload);
      toast({ title: 'Settings Saved', description: `Your ${section} settings have been updated.` });
      if (section === 'branding' && logoPreview) {
        setLogoPreview(null);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || `Failed to save ${section} settings`, variant: 'destructive' });
    } finally {
      setSavingSection(null);
    }
  };

  const renderSkeleton = () => (
    <Card className="backdrop-blur-xl bg-card/70 border-border shadow-xl">
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-24" />
      </CardFooter>
    </Card>
  );

  if (isLoading) {
    return (
       <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-background p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Manage your organization profile and preferences
            </p>
          </div>
          {renderSkeleton()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-background p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Manage your organization profile and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-2 gap-2 bg-muted p-1 h-auto">
            <TabsTrigger value="profile"><Building2 className="h-4 w-4 mr-2" />Profile</TabsTrigger>
            <TabsTrigger value="branding"><Palette className="h-4 w-4 mr-2" />Customization</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card className="backdrop-blur-xl bg-card/70 border-border shadow-xl">
              <CardHeader>
                <CardTitle>Organization Profile</CardTitle>
                <CardDescription>This is your business information that will appear on receipts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Organization Name</Label>
                    <Input id="companyName" name="companyName" value={organization.companyName || ''} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Public Email</Label>
                    <Input id="email" name="email" type="email" value={organization.email || ''} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Public Phone Number</Label>
                    <Input id="phoneNumber" name="phoneNumber" value={organization.phoneNumber || ''} onChange={handleInputChange} />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" value={organization.address || ''} onChange={handleInputChange} />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleSave('profile')} disabled={savingSection === 'profile'}>
                  {savingSection === 'profile' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {savingSection === 'profile' ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

           <TabsContent value="branding">
             <Card className="backdrop-blur-xl bg-card/70 border-border shadow-xl">
              <CardHeader>
                <CardTitle>Receipt Customization</CardTitle>
                <CardDescription>Customize the look and feel of your receipts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Company Logo</Label>
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24 rounded-lg border-2 border-dashed">
                      <AvatarImage 
                        src={logoPreview || organization.logoUrl || '/logo.png'} 
                        alt="Company Logo" 
                        className="object-contain rounded-md" 
                      />
                      <AvatarFallback className="rounded-lg bg-secondary">
                        <Building2 className="h-10 w-10 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <Label htmlFor="logo-upload" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Image
                        </Label>
                        <Input id="logo-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/gif" onChange={handleLogoChange} />
                        <p className="text-xs text-muted-foreground mt-2">Recommended: Square image, PNG or JPG, under 500kb.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thankYouMessage">Default "Thank You" Message</Label>
                  <Textarea 
                    id="thankYouMessage" 
                    name="thankYouMessage"
                    value={organization.thankYouMessage || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Thank you for your business!"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleSave('branding')} disabled={savingSection === 'branding'}>
                  {savingSection === 'branding' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {savingSection === 'branding' ? 'Saving...' : 'Save Customizations'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
