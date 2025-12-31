import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Rocket, Mail, Smartphone, Zap, Shield, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-black dark:via-slate-900 dark:to-slate-950">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-500/20 dark:to-purple-500/20" />
        <div className="relative container mx-auto px-6 pt-8 pb-32 lg:px-8">
          <nav className="flex items-center justify-between mb-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ReceiptRocket
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button size="sm" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link href="/signup">Sign Up Free</Link>
              </Button>
            </div>
          </nav>

          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Digital Receipts
              </span>
              <br />
              <span className="text-foreground">That Actually Get Opened</span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              Beautiful, branded receipts delivered instantly via email & SMS. 
              Boost customer engagement, reduce paper waste, and look professional — all in seconds.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" asChild className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl">
                <Link href="/signup" className="flex items-center gap-2">
                  Start Sending Receipts Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="backdrop-blur-md">
                Watch Demo
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required • Unlimited receipts on free plan
            </p>
          </div>
        </div>

        {/* Floating preview card */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-6">
          <Card className="p-8 shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-black/80 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <h3 className="font-semibold">Email Delivery</h3>
                <p className="text-sm text-muted-foreground mt-1">Branded, responsive templates</p>
              </div>
              <div className="text-center">
                <Smartphone className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold">SMS Receipts</h3>
                <p className="text-sm text-muted-foreground mt-1">Instant text with secure link</p>
              </div>
              <div className="text-center">
                <Zap className="w-12 h-12 mx-auto mb-3 text-indigo-600" />
                <h3 className="font-semibold">Real-time Tracking</h3>
                <p className="text-sm text-muted-foreground mt-1">Know when customers view</p>
              </div>
            </div>
          </Card>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-32 container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold">Everything you need to go paperless</h2>
          <p className="mt-4 text-lg text-muted-foreground">Modern tools for modern businesses</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { icon: Shield, title: "Secure & Compliant", desc: "GDPR-ready, encrypted delivery, and audit logs" },
            { icon: Zap, title: "Lightning Fast", desc: "Send receipts in under 2 seconds" },
            { icon: Check, title: "Custom Branding", desc: "Your logo, colors, and message — perfectly" },
          ].map((feature, i) => (
            <Card key={i} className="p-8 hover:shadow-xl transition-shadow border border-border/50">
              <feature.icon className="w-10 h-10 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Ready to upgrade your receipts?
          </h2>
          <p className="mt-4 text-xl text-white/90">
            Join thousands of businesses already saving time and delighting customers.
          </p>
          <div className="mt-10">
            <Button size="lg" variant="secondary" asChild className="shadow-xl">
              <Link href="/signup">Get Started Free →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ReceiptRocket. All rights reserved.
        </div>
      </footer>
    </div>
  );
}