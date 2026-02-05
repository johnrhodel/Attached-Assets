import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,50,255,0.1),transparent_50%)]" />
      </div>

      <div className="z-10 text-center max-w-2xl animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-foreground mb-6">
          Memory.
        </h1>
        <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
          Create commemorative digital artifacts for physical locations. 
          Bridge the gap between experience and ownership.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/admin/login">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full">
              Admin Portal <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/claim/1">
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full">
              Demo Claim Flow
            </Button>
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-8 text-sm text-muted-foreground">
        &copy; 2024 Memory Protocol. All rights reserved.
      </footer>
    </div>
  );
}
