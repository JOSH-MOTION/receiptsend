import { Button } from '@/components/ui/button';
import { Rocket, Mail, Smartphone, Edit, BarChart, ShieldCheck, Zap, Users, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-black dark:via-slate-900 dark:to-green-950/20 text-foreground">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="container mx-auto px-6 pt-8 pb-20 md:pb-32 lg:px-8 relative z-10">
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
            <div className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button size="sm" asChild className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg">
                <Link href="/signup">Sign Up Free</Link>
              </Button>
            </div>
          </nav>

          <div className="max-w-4xl mx-auto text-center">
             <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Digital Receipts, Delivered Instantly
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Create, customize, and send beautiful digital receipts via Email & SMS. Impress your customers and manage your transactions effortlessly.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" asChild className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl transform hover:scale-105 transition-transform duration-300">
                <Link href="/signup" className="flex items-center gap-2">
                  Get Started for Free
                  <Rocket className="w-5 h-5 group-hover:translate-x-1 transition" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-grid-green-500/10 dark:bg-grid-green-400/10 [mask-image:linear-gradient(to_bottom,white_5%,transparent_80%)]"></div>
      </header>

      <main className="container mx-auto px-6 lg:px-8 py-16 md:py-24 space-y-24 md:space-y-32">
        {/* Features Section */}
        <section id="features" className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">SENDORA</span>?</h2>
          <p className="max-w-3xl mx-auto text-muted-foreground text-lg mb-12">
            Everything you need to modernize your transaction receipts.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Instant Delivery", description: "Send receipts instantly via Email or SMS the moment a transaction is complete." },
              { icon: Edit, title: "Easy Customization", description: "Add your logo, custom messages, and branding to every receipt you send." },
              { icon: Mail, title: "Multi-Channel", description: "Reach customers wherever they are. We support both email and SMS delivery out of the box." },
              { icon: BarChart, title: "Insightful Dashboard", description: "Track your sales, revenue, and customer engagement with our clean dashboard." },
              { icon: Users, title: "Contact Management", description: "Automatically build a customer contact list with every receipt you create." },
              { icon: ShieldCheck, title: "Secure & Reliable", description: "Built on modern, scalable infrastructure to ensure your data is safe." },
            ].map(feature => (
              <Card key={feature.title} className="text-left backdrop-blur-xl bg-white/60 dark:bg-black/30 border-green-200 dark:border-green-900 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works">
           <div className="text-center">
             <h2 className="text-4xl md:text-5xl font-bold mb-4">Get Started in 3 Simple Steps</h2>
            <p className="max-w-3xl mx-auto text-muted-foreground text-lg mb-16">
              Sending your first digital receipt takes less than a minute.
            </p>
           </div>
           <div className="relative">
              <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-green-200 dark:bg-green-900/50"></div>
              <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="flex flex-col items-center text-center">
                      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white border-4 border-background dark:border-background/20 shadow-lg mb-6">
                          <span className="text-3xl font-bold">1</span>
                      </div>
                      <h3 className="text-2xl font-semibold mb-2">Create Account</h3>
                      <p className="text-muted-foreground">Sign up for a free SENDORA account. No credit card required.</p>
                  </div>
                   <div className="flex flex-col items-center text-center">
                      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white border-4 border-background dark:border-background/20 shadow-lg mb-6">
                           <span className="text-3xl font-bold">2</span>
                      </div>
                      <h3 className="text-2xl font-semibold mb-2">Generate Receipt</h3>
                      <p className="text-muted-foreground">Use our simple form to enter transaction details and add items.</p>
                  </div>
                   <div className="flex flex-col items-center text-center">
                      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white border-4 border-background dark:border-background/20 shadow-lg mb-6">
                           <span className="text-3xl font-bold">3</span>
                      </div>
                      <h3 className="text-2xl font-semibold mb-2">Click Send</h3>
                      <p className="text-muted-foreground">Your customer instantly receives a professional digital receipt.</p>
                  </div>
              </div>
           </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="space-y-12">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by Businesses Worldwide</h2>
            <p className="max-w-3xl mx-auto text-muted-foreground text-lg">
              Don't just take our word for it. Here's what our customers are saying.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Sarah L.", company: "The Corner Cafe", quote: "SENDORA revolutionized how we handle receipts. It's so fast and our customers love the convenience. Plus, it makes us look so much more professional!" },
              { name: "Mike R.", company: "Indie Tech Shop", quote: "As a small business, every detail matters. The customizable templates are a game-changer for our branding. Setup was a breeze." },
              { name: "Elena G.", company: "Blossom & Bloom", quote: "I can't believe it's free to get started. The dashboard gives me great insights into my sales, and managing contacts is now automatic. Highly recommend!" },
            ].map((testimonial) => (
               <Card key={testimonial.name} className="backdrop-blur-xl bg-white/60 dark:bg-black/30 border-green-200 dark:border-green-900 shadow-xl flex flex-col">
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-muted-foreground italic flex-1">"{testimonial.quote}"</p>
                  <div className="mt-4 pt-4 border-t border-green-100 dark:border-green-900/50">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-12 text-center shadow-2xl shadow-green-500/20">
          <h2 className="text-4xl font-bold mb-4">Ready to Ditch Paper Receipts?</h2>
          <p className="max-w-2xl mx-auto text-lg text-green-100 mb-8">
            Join thousands of businesses modernizing their transactions. Create your free account today.
          </p>
           <Button size="lg" asChild variant="secondary" className="group bg-white text-green-700 hover:bg-green-50 shadow-lg transform hover:scale-105 transition-transform duration-300">
            <Link href="/signup" className="flex items-center gap-2">
              Sign Up Now
              <Rocket className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
          </Button>
        </section>

      </main>

      <footer className="py-12 border-t border-green-100 dark:border-green-900/50">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SENDORA. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
