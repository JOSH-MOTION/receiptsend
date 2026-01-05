"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Building2, Mail, Palette, Smartphone, CreditCard, Save, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Organization {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  smsCredits: number;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [organization, setOrganization] = useState<Organization>({
    name: "",
    email: "",
    phone: "",
    address: "",
    primaryColor: "#16a34a",
    secondaryColor: "#10b981",
    smsCredits: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchOrganization();
    }
  }, [session]);

  const fetchOrganization = async () => {
    try {
      const response = await fetch("/api/organization");
      if (response.ok) {
        const data = await response.json();
        setOrganization(data);
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(organization),
      });

      if (response.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error saving organization:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurchaseSMS = async (bundleSize: number, price: number) => {
    try {
      const response = await fetch("/api/sms/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleSize, price }),
      });

      if (response.ok) {
        fetchOrganization();
      }
    } catch (error) {
      console.error("Error purchasing SMS credits:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-black dark:via-slate-900 dark:to-green-950/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Manage your organization profile and preferences
          </p>
        </div>

        {/* Tabs - Responsive Grid */}
        <Tabs defaultValue="organization" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 bg-green-100/50 dark:bg-green-950/30 p-1 h-auto">
            <TabsTrigger value="organization" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-green-900 text-xs sm:text-sm py-2 px-2 sm:px-4">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Organization</span>
              <span className="sm:hidden">Org</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-green-900 text-xs sm:text-sm py-2 px-2 sm:px-4">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-green-900 text-xs sm:text-sm py-2 px-2 sm:px-4">
              <Smartphone className="h-4 w-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-green-900 text-xs sm:text-sm py-2 px-2 sm:px-4">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
              <span className="sm:hidden">Brand</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-green-900 text-xs sm:text-sm py-2 px-2 sm:px-4">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
              <span className="sm:hidden">Bill</span>
            </TabsTrigger>
          </TabsList>

          {/* Organization Tab */}
          <TabsContent value="organization" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Organization Details</CardTitle>
                <CardDescription className="text-sm">Update your business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-green-200 dark:bg-green-900 rounded w-24" />
                        <div className="h-10 bg-green-200 dark:bg-green-900 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="orgName">Organization Name</Label>
                        <Input
                          id="orgName"
                          value={organization.name}
                          onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
                          className="border-green-200 dark:border-green-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orgEmail">Email</Label>
                        <Input
                          id="orgEmail"
                          type="email"
                          value={organization.email}
                          onChange={(e) => setOrganization({ ...organization, email: e.target.value })}
                          className="border-green-200 dark:border-green-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orgPhone">Phone</Label>
                      <Input
                        id="orgPhone"
                        type="tel"
                        value={organization.phone}
                        onChange={(e) => setOrganization({ ...organization, phone: e.target.value })}
                        className="border-green-200 dark:border-green-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orgAddress">Address</Label>
                      <Textarea
                        id="orgAddress"
                        value={organization.address}
                        onChange={(e) => setOrganization({ ...organization, address: e.target.value })}
                        className="border-green-200 dark:border-green-900 min-h-24"
                      />
                    </div>

                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {savedSuccess ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Saved!
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {isSaving ? "Saving..." : "Save Changes"}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Email Settings</CardTitle>
                <CardDescription className="text-sm">Configure email delivery options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Email delivery is configured and ready to use. All receipts will be sent from your organization email.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Tab */}
          <TabsContent value="sms" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">SMS Credits</CardTitle>
                    <CardDescription className="text-sm">Purchase credits to send receipts via SMS</CardDescription>
                  </div>
                  <Badge className="bg-green-600 text-white text-base sm:text-lg px-4 py-2">
                    {organization.smsCredits} Credits
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { credits: 100, price: 10, popular: false },
                    { credits: 500, price: 45, popular: true },
                    { credits: 1000, price: 80, popular: false },
                  ].map((bundle) => (
                    <Card
                      key={bundle.credits}
                      className={`relative overflow-hidden ${
                        bundle.popular
                          ? "border-2 border-green-500 shadow-lg"
                          : "border border-green-200 dark:border-green-900"
                      }`}
                    >
                      {bundle.popular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs px-3 py-1 rounded-bl-lg">
                          Popular
                        </div>
                      )}
                      <CardHeader className="pb-4">
                        <CardTitle className="text-2xl sm:text-3xl font-bold text-center">{bundle.credits}</CardTitle>
                        <CardDescription className="text-center text-sm">SMS Credits</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl sm:text-4xl font-bold text-green-600">${bundle.price}</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            ${(bundle.price / bundle.credits).toFixed(2)} per SMS
                          </p>
                        </div>
                        <Button
                          onClick={() => handlePurchaseSMS(bundle.credits, bundle.price)}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          Purchase
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Brand Colors</CardTitle>
                <CardDescription className="text-sm">Customize your receipt appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={organization.primaryColor}
                        onChange={(e) => setOrganization({ ...organization, primaryColor: e.target.value })}
                        className="h-10 w-20 border-green-200 dark:border-green-900"
                      />
                      <Input
                        value={organization.primaryColor}
                        onChange={(e) => setOrganization({ ...organization, primaryColor: e.target.value })}
                        className="flex-1 border-green-200 dark:border-green-900"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={organization.secondaryColor}
                        onChange={(e) => setOrganization({ ...organization, secondaryColor: e.target.value })}
                        className="h-10 w-20 border-green-200 dark:border-green-900"
                      />
                      <Input
                        value={organization.secondaryColor}
                        onChange={(e) => setOrganization({ ...organization, secondaryColor: e.target.value })}
                        className="flex-1 border-green-200 dark:border-green-900"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Billing Information</CardTitle>
                <CardDescription className="text-sm">Manage your payment methods and billing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 sm:p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-900 text-center">
                  <CreditCard className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-green-600 mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Payment Integration Coming Soon</h3>
                  <p className="text-sm text-muted-foreground">
                    We're working on integrating secure payment options for your convenience.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}