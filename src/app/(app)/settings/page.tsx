"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Building, Palette, Save, Loader2, Building2, Upload, X, CheckCircle2, ImageIcon } from "lucide-react";
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
import { uploadToCloudinary, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@/lib/cloudinary";
import { Progress } from "@/components/ui/progress";


interface Organization {
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  thankYouMessage?: string;
  logoUrl?: string;
}

const MAX_FILE_SIZE_MB = 2;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

export default function SettingsPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [organization, setOrganization] = useState<Partial<Organization>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);
  
  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setLogoError(null);

    if (!file) return;

    // Validate type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setLogoError('Please upload a PNG, JPG, GIF, or WebP image.');
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setLogoError(`File size must be under ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setLogoFile(file);
    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        address: organization.address,
      };
    } else if (section === 'branding') {
      payload = {
        thankYouMessage: organization.thankYouMessage,
      };

      // Upload to Cloudinary if a new file is selected
      if (logoFile) {
        setIsUploadingLogo(true);
        setUploadProgress(30);
        try {
          const result = await uploadToCloudinary(logoFile);
          setUploadProgress(100);
          payload.logoUrl = result.secure_url;
          toast({
            title: 'Logo Uploaded!',
            description: 'Your logo has been uploaded successfully.',
          });
        } catch (err: any) {
          setIsUploadingLogo(false);
          setUploadProgress(0);
          setSavingSection(null);
          toast({
            title: 'Upload Failed',
            description: err.message || 'Could not upload logo. Please try again.',
            variant: 'destructive',
          });
          return;
        } finally {
          setIsUploadingLogo(false);
          setUploadProgress(0);
        }
      }
    }

    try {
      await updateDoc(orgRef, payload);
      toast({ title: 'Settings Saved', description: `Your ${section} settings have been updated.` });
      if (section === 'branding' && logoFile) {
        setLogoFile(null);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
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

  const currentLogoUrl = logoPreview || organization.logoUrl;
  const isCloudinaryConfigured = true;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-background p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Settings</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your organization profile and preferences</p>
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
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Settings</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your organization profile and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 gap-2 bg-muted p-1 h-auto">
            <TabsTrigger value="profile"><Building2 className="h-4 w-4 mr-2" />Profile</TabsTrigger>
            <TabsTrigger value="branding"><Palette className="h-4 w-4 mr-2" />Customization</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
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

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card className="backdrop-blur-xl bg-card/70 border-border shadow-xl">
              <CardHeader>
                <CardTitle>Receipt Customization</CardTitle>
                <CardDescription>Customize the look and feel of your receipts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">

                {/* Logo Upload Section */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Company Logo</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      This logo will appear on all your receipts. Recommended: square image, under {MAX_FILE_SIZE_MB}MB.
                    </p>
                  </div>

                  {/* Cloudinary config warning */}
                  {!isCloudinaryConfigured && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                      <ImageIcon className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-700 dark:text-amber-400">
                        <strong>Cloudinary not configured.</strong> Add{' '}
                        <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> and{' '}
                        <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code>{' '}
                        to your <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env.local</code> file for cloud image storage.
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    {/* Logo Preview */}
                    <div className="relative flex-shrink-0">
                      <div className={cn(
                        "w-28 h-28 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all",
                        logoFile ? "border-primary bg-primary/5" : "border-border bg-muted/30"
                      )}>
                        {currentLogoUrl ? (
                          <Image
                            src={currentLogoUrl}
                            alt="Company Logo"
                            fill
                            className="object-contain p-2"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Building2 className="h-10 w-10" />
                            <span className="text-xs">No logo</span>
                          </div>
                        )}
                      </div>
                      {/* Remove button */}
                      {(logoFile || logoPreview) && (
                        <button
                          onClick={handleRemoveLogo}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center shadow hover:bg-destructive/90 transition"
                          title="Remove new logo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Upload controls */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <label
                          htmlFor="logo-upload"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "cursor-pointer gap-2"
                          )}
                        >
                          <Upload className="h-4 w-4" />
                          {currentLogoUrl ? 'Change Logo' : 'Upload Logo'}
                        </label>
                        <input
                          id="logo-upload"
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept={ACCEPTED_IMAGE_TYPES.join(',')}
                          onChange={handleLogoChange}
                        />
                        {organization.logoUrl && !logoFile && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={async () => {
                              if (!orgRef) return;
                              try {
                                await updateDoc(orgRef, { logoUrl: '' });
                                setOrganization(prev => ({ ...prev, logoUrl: '' }));
                                toast({ title: 'Logo Removed', description: 'Your logo has been removed.' });
                              } catch (e: any) {
                                toast({ title: 'Error', description: e.message, variant: 'destructive' });
                              }
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Supported formats: PNG, JPG, GIF, WebP · Max {MAX_FILE_SIZE_MB}MB
                      </p>

                      {/* File selected indicator */}
                      {logoFile && (
                        <div className="flex items-center gap-2 text-xs text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="font-medium">{logoFile.name}</span>
                          <span className="text-muted-foreground">({(logoFile.size / 1024).toFixed(0)} KB) — ready to save</span>
                        </div>
                      )}

                      {/* Error message */}
                      {logoError && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <X className="h-3.5 w-3.5" />
                          {logoError}
                        </p>
                      )}

                      {/* Upload progress */}
                      {isUploadingLogo && (
                        <div className="space-y-1">
                          <Progress value={uploadProgress} className="h-1.5" />
                          <p className="text-xs text-muted-foreground">Uploading to Cloudinary...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Thank You Message */}
                <div className="space-y-2">
                  <Label htmlFor="thankYouMessage">Default "Thank You" Message</Label>
                  <Textarea
                    id="thankYouMessage"
                    name="thankYouMessage"
                    value={organization.thankYouMessage || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Thank you for your business!"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This message appears at the bottom of every receipt. You can override it per receipt.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSave('branding')}
                  disabled={savingSection === 'branding' || isUploadingLogo || !!logoError}
                >
                  {(savingSection === 'branding' || isUploadingLogo) ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isUploadingLogo ? 'Uploading...' : savingSection === 'branding' ? 'Saving...' : 'Save Customizations'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}