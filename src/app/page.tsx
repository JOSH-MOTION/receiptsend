import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-black dark:via-slate-900 dark:to-green-950/20">
      <header className="relative overflow-hidden">
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
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </nav>

          <div className="max-w-4xl mx-auto text-center">
             <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Welcome to SENDORA
              </span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              Your platform for digital receipts.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" asChild className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl">
                <Link href="/dashboard" className="flex items-center gap-2">
                  Go to Dashboard
                  <Rocket className="w-5 h-5 group-hover:translate-x-1 transition" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <footer className="py-12 border-t border-green-100 dark:border-green-900">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SENDORA. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
