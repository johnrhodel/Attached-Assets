import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n/context";
import { 
  ArrowRight, 
  Layers, 
  QrCode, 
  Mail, 
  Code2, 
  BarChart3, 
  Shield,
  ChevronRight
} from "lucide-react";

const featureIcons = [Layers, QrCode, Mail, Code2, BarChart3, Shield];

export default function Home() {
  const { t } = useI18n();

  const features = [
    { icon: featureIcons[0], title: t.landing.feature_multi_chain, desc: t.landing.feature_multi_chain_desc },
    { icon: featureIcons[1], title: t.landing.feature_qr, desc: t.landing.feature_qr_desc },
    { icon: featureIcons[2], title: t.landing.feature_walletless, desc: t.landing.feature_walletless_desc },
    { icon: featureIcons[3], title: t.landing.feature_embed, desc: t.landing.feature_embed_desc },
    { icon: featureIcons[4], title: t.landing.feature_admin, desc: t.landing.feature_admin_desc },
    { icon: featureIcons[5], title: t.landing.feature_security, desc: t.landing.feature_security_desc },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-serif font-bold text-xl text-foreground" data-testid="text-brand-name">Mintoria</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Link href="/admin/login">
            <Button variant="ghost" size="sm" data-testid="link-admin-login">
              {t.landing.admin_portal}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-30%] right-[-20%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-30%] left-[-20%] w-[800px] h-[800px] bg-blue-400/5 rounded-full blur-[120px]" />
        </div>

        <div className="z-10 text-center max-w-3xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8" data-testid="badge-tagline">
            <Layers className="w-3.5 h-3.5" />
            NFT Minting Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-foreground mb-6" data-testid="text-hero-title">
            {t.landing.hero_title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto" data-testid="text-hero-subtitle">
            {t.landing.hero_subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link href="/claim/1">
              <Button size="lg" className="h-14 px-8 text-lg" data-testid="button-try-demo">
                {t.landing.try_demo} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg" data-testid="button-admin-portal">
                {t.landing.admin_portal} <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full px-6 py-16 md:py-24 bg-accent/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-4" data-testid="text-features-title">
            {t.landing.features_title}
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            {t.landing.hero_subtitle}
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-shadow" data-testid={`card-feature-${i}`}>
                  <CardContent className="pt-6">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-serif font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
            {t.landing.try_demo}
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link href="/claim/1">
              <Button size="lg" className="h-14 px-10 text-lg" data-testid="button-cta-demo">
                {t.landing.try_demo} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full px-6 py-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Layers className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-serif font-bold text-sm text-foreground">Mintoria</span>
          </div>
          <p className="text-sm text-muted-foreground" data-testid="text-copyright">
            &copy; 2026 {t.landing.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}
