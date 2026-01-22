import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-secondary/20 via-background to-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10">
              <Image
                src="/logo.png"
                alt="SENDORA Logo"
                fill
                className="object-contain group-hover:scale-110 transition-transform"
                priority
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SENDORA
            </span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
