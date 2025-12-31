import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Rocket, Mail, Smartphone, Zap, Shield, ArrowRight, Check, Leaf, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-black dark:via-slate-900 dark:to-green-950/20">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10 dark:from-green-500/20 dark:to-emerald-500/20" />
        <div className="relative container mx-auto px-6 pt-8 pb-32 lg:px-8">
          <nav className="flex items-center justify-between mb-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10">
                <Image
                  src="/logo.png"
                  alt="SENDORA Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                SENDORA
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button size="sm" asChild className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <Link href="/signup">Sign Up Free</Link>
              </Button>
            </div>
          </nav>

          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-700 dark:text-green-300 text-sm font-medium mb-8">
              <Leaf className="w-4 h-4" />
              <span>Eco-Friendly Digital Receipts</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
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
              <Button size="lg" asChild className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl">
                <Link href="/signup" className="flex items-center gap-2">
                  Start Sending Receipts Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="backdrop-blur-md border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20">
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
          <Card className="p-8 shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-black/80 border border-green-200/50 dark:border-green-800/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold">Email Delivery</h3>
                <p className="text-sm text-muted-foreground mt-1">Branded, responsive templates</p>
              </div>
              <div className="text-center">
                <Smartphone className="w-12 h-12 mx-auto mb-3 text-emerald-600" />
                <h3 className="font-semibold">SMS Receipts</h3>
                <p className="text-sm text-muted-foreground mt-1">Instant text with secure link</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-teal-600" />
                <h3 className="font-semibold">Real-time Analytics</h3>
                <p className="text-sm text-muted-foreground mt-1">Track and optimize engagement</p>
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
            { icon: Shield, title: "Secure & Compliant", desc: "GDPR-ready, encrypted delivery, and audit logs", color: "text-green-600" },
            { icon: Zap, title: "Lightning Fast", desc: "Send receipts in under 2 seconds", color: "text-emerald-600" },
            { icon: Check, title: "Custom Branding", desc: "Your logo, colors, and message — perfectly", color: "text-teal-600" },
          ].map((feature, i) => (
            <Card key={i} className="p-8 hover:shadow-xl transition-all hover:-translate-y-1 border border-green-100 dark:border-green-900/50 group">
              <feature.icon className={`w-10 h-10 mb-4 ${feature.color}`} />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Ready to upgrade your receipts?
          </h2>
          <p className="mt-4 text-xl text-white/90">
            Join thousands of businesses already saving time and delighting customers.
          </p>
          <div className="mt-10">
            <Button size="lg" variant="secondary" asChild className="shadow-xl hover:scale-105 transition-transform">
              <Link href="/signup">Get Started Free →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-green-100 dark:border-green-900">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SENDORA. All rights reserved.
        </div>
      </footer>
    </div>
  );
}