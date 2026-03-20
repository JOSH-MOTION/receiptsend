"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Building, Palette, Save, Loader2, Building2, Upload, X, CheckCircle2, ImageIcon, CreditCard, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Settings</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage your organization profile and preferences</p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <Link href="/sms-credits">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 text-white">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">SMS Credits</h3>
                      <p className="text-sm text-gray-600">Manage your SMS balance</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 gap-2 bg-gray-100 p-1 h-auto">
            <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-green-600"><Building2 className="h-4 w-4 mr-2" />Profile</TabsTrigger>
            <TabsTrigger value="branding" className="data-[state=active]:bg-white data-[state=active]:text-green-600"><Palette className="h-4 w-4 mr-2" />Customization</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Organization Profile</CardTitle>
                <CardDescription className="text-gray-600">This is your business information that will appear on receipts.</CardDescription>
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
                <Button 
                  onClick={() => handleSave('profile')} 
                  disabled={savingSection === 'profile'}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  {savingSection === 'profile' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {savingSection === 'profile' ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Receipt Customization</CardTitle>
                <CardDescription className="text-gray-600">Customize the look and feel of your receipts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">

                {/* Logo Upload Section */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold text-gray-900">Company Logo</Label>
                    <p className="text-xs text-gray-600 mt-1">
                      This logo will appear on all your receipts. Recommended: square image, under {MAX_FILE_SIZE_MB}MB.
                    </p>
                  </div>

                  {/* Cloudinary config warning */}
                  {!isCloudinaryConfigured && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <ImageIcon className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-700">
                        <strong>Cloudinary not configured.</strong> Add{' '}
                        <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> and{' '}
                        <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code>{' '}
                        to your <code className="bg-amber-100 px-1 rounded">.env.local</code> file for cloud image storage.
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    {/* Logo Preview */}
                    <div className="relative flex-shrink-0">
                      <div className={cn(
                        "w-28 h-28 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all",
                        logoFile ? "border-green-600 bg-green-50" : "border-gray-300 bg-gray-50"
                      )}>
                        {currentLogoUrl ? (
                          <Image
                            src={currentLogoUrl}
                            alt="Company Logo"
                            fill
                            className="object-contain p-2"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-gray-500">
                            <Building2 className="h-10 w-10" />
                            <span className="text-xs">No logo</span>
                          </div>
                        )}
                      </div>
                      {/* Remove button */}
                      {(logoFile || logoPreview) && (
                        <button
                          onClick={handleRemoveLogo}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow hover:bg-red-700 transition"
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
                            "cursor-pointer gap-2 border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
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
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

                      <p className="text-xs text-gray-600">
                        Supported formats: PNG, JPG, GIF, WebP · Max {MAX_FILE_SIZE_MB}MB
                      </p>

                      {/* File selected indicator */}
                      {logoFile && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="font-medium">{logoFile.name}</span>
                          <span className="text-gray-500">({(logoFile.size / 1024).toFixed(0)} KB) — ready to save</span>
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
                  <p className="text-xs text-gray-600">
                    This message appears at the bottom of every receipt. You can override it per receipt.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSave('branding')}
                  disabled={savingSection === 'branding' || isUploadingLogo || !!logoError}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
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