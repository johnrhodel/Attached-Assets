import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ChevronRight,
  Linkedin,
  KeyRound,
  Check,
  Zap,
  MapPin,
  Sparkles,
  Loader2
} from "lucide-react";

import heroConcert from "../assets/images/hero-concert.jpg";
import heroTourist from "../assets/images/hero-tourist.jpg";
import heroSelfie from "../assets/images/hero-selfie.jpg";
import featureTravel from "../assets/images/feature-travel.jpg";
import featureQrCode from "../assets/images/feature-qrcode.jpg";
import founderPhoto from "@assets/John_Rhodel_(3)_1770414803489.jpeg";

const heroImages = [
  { src: heroConcert, alt: "Concert crowd enjoying live music" },
  { src: heroTourist, alt: "Tourists at scenic landmark" },
  { src: heroSelfie, alt: "Friends capturing a moment together" },
];

const featureIcons = [Layers, QrCode, Mail, Code2, BarChart3, Shield];

interface PublicPricingPlan {
  id: number;
  name: string;
  description: string;
  price: string;
  pricePer: string;
  features: string[];
  highlighted: boolean;
  sortOrder: number;
}

interface PricingTranslations {
  title: string;
  subtitle: string;
  free: string;
  freeDesc: string;
  freePrice: string;
  freePer: string;
  freeFeatures: readonly string[];
  starter: string;
  starterDesc: string;
  starterPrice: string;
  starterPer: string;
  starterFeatures: readonly string[];
  professional: string;
  professionalDesc: string;
  professionalPrice: string;
  professionalPer: string;
  professionalFeatures: readonly string[];
  enterprise: string;
  enterpriseDesc: string;
  enterprisePrice: string;
  enterprisePer: string;
  enterpriseFeatures: readonly string[];
  popular: string;
  contact: string;
}

type PlanKey = 'free' | 'starter' | 'professional' | 'enterprise';

interface PlanI18nMapping {
  name: keyof PricingTranslations;
  desc: keyof PricingTranslations;
  price: keyof PricingTranslations;
  per: keyof PricingTranslations;
  features: keyof PricingTranslations;
}

const PLAN_I18N_MAP: Record<PlanKey, PlanI18nMapping> = {
  free: { name: 'free', desc: 'freeDesc', price: 'freePrice', per: 'freePer', features: 'freeFeatures' },
  starter: { name: 'starter', desc: 'starterDesc', price: 'starterPrice', per: 'starterPer', features: 'starterFeatures' },
  professional: { name: 'professional', desc: 'professionalDesc', price: 'professionalPrice', per: 'professionalPer', features: 'professionalFeatures' },
  enterprise: { name: 'enterprise', desc: 'enterpriseDesc', price: 'enterprisePrice', per: 'enterprisePer', features: 'enterpriseFeatures' },
};

function getPlanKey(name: string): PlanKey | null {
  const lower = name.toLowerCase();
  if (lower === 'free' || lower === 'gratuito' || lower === 'gratis') return 'free';
  if (lower === 'starter') return 'starter';
  if (lower === 'professional' || lower === 'profissional' || lower === 'profesional') return 'professional';
  if (lower === 'enterprise') return 'enterprise';
  return null;
}

function getLocalizedPlan(plan: PublicPricingPlan, pricing: PricingTranslations): PublicPricingPlan {
  const key = getPlanKey(plan.name);
  if (!key) return plan;
  const map = PLAN_I18N_MAP[key];
  return {
    ...plan,
    name: String(pricing[map.name]) || plan.name,
    description: String(pricing[map.desc]) || plan.description,
    price: String(pricing[map.price]) || plan.price,
    pricePer: String(pricing[map.per]) || plan.pricePer,
    features: Array.isArray(pricing[map.features]) ? [...pricing[map.features] as readonly string[]] : plan.features,
  };
}

function usePublicStats() {
  return useQuery({
    queryKey: ["/api/public/stats"],
    queryFn: async () => {
      const res = await fetch("/api/public/stats");
      if (!res.ok) return { totalMinted: 0, activeLocations: 0, activeDrops: 0 };
      return await res.json();
    },
    refetchInterval: 30000,
  });
}

function usePublicPricing() {
  return useQuery<PublicPricingPlan[]>({
    queryKey: ["/api/public/pricing"],
    queryFn: async () => {
      const res = await fetch("/api/public/pricing");
      if (!res.ok) return [];
      return await res.json();
    },
  });
}

export default function Home() {
  const { t } = useI18n();
  const [currentImage, setCurrentImage] = useState(0);
  const { data: stats } = usePublicStats();
  const { data: pricingPlans, isLoading: pricingLoading } = usePublicPricing();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      <header className="absolute top-0 left-0 right-0 z-30 w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap max-w-7xl mx-auto">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-md flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-serif font-bold text-lg sm:text-xl text-white drop-shadow-md" data-testid="text-brand-name">Mintoria</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <LanguageSelector />
          <Link href="/admin/login">
            <Button variant="outline" size="sm" className="bg-white/10 backdrop-blur-sm border-white/20 text-white" data-testid="link-login">
              {t.nav.login}
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="shadow-md" data-testid="link-register">
              {t.auth.registerButton}
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative h-[90vh] sm:h-[85vh] min-h-[550px] flex items-center justify-center overflow-hidden">
        {heroImages.map((img, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: currentImage === index ? 1 : 0 }}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 z-10" />

        <div className="relative z-20 text-center max-w-3xl px-5 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs sm:text-sm font-medium mb-6 sm:mb-8" data-testid="badge-tagline">
            <Layers className="w-3.5 h-3.5 shrink-0" />
            {t.landing.hero_tagline}
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold tracking-tight text-white mb-4 sm:mb-6 drop-shadow-lg" data-testid="text-hero-title">
            {t.landing.hero_title}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/80 mb-8 sm:mb-12 leading-relaxed max-w-2xl mx-auto" data-testid="text-hero-subtitle">
            {t.landing.hero_subtitle}
          </p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Link href="/access">
              <Button size="lg" className="w-full sm:w-auto relative overflow-hidden group shadow-lg shadow-primary/25" data-testid="button-try-demo">
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <KeyRound className="mr-2 w-5 h-5" />
                {t.landing.try_demo}
              </Button>
            </Link>
          </motion.div>

          {stats && (
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mt-8 sm:mt-10" data-testid="section-live-stats">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-white/60" />
                  <span className="text-2xl sm:text-3xl font-bold text-white" data-testid="stat-total-minted">{stats.totalMinted || 0}</span>
                </div>
                <span className="text-xs text-white/60">{t.stats.totalMinted}</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <MapPin className="w-4 h-4 text-white/60" />
                  <span className="text-2xl sm:text-3xl font-bold text-white" data-testid="stat-locations">{stats.activeLocations || 0}</span>
                </div>
                <span className="text-xs text-white/60">{t.stats.activeLocations}</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Zap className="w-4 h-4 text-white/60" />
                  <span className="text-2xl sm:text-3xl font-bold text-white" data-testid="stat-drops">{stats.activeDrops || 0}</span>
                </div>
                <span className="text-xs text-white/60">{t.stats.activeDrops}</span>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-2 mt-8 sm:mt-10">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                  currentImage === index ? 'bg-white' : 'bg-white/40'
                }`}
                data-testid={`button-hero-dot-${index}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-background py-10 sm:py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="relative rounded-md overflow-hidden h-48 sm:h-56 md:h-64">
              <img src={featureTravel} alt="Tourist destination" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="font-serif font-bold text-base sm:text-lg">{t.landing.feature_qr}</h3>
                <p className="text-xs sm:text-sm text-white/80">{t.landing.feature_qr_desc}</p>
              </div>
            </div>
            <div className="relative rounded-md overflow-hidden h-48 sm:h-56 md:h-64">
              <img src={featureQrCode} alt="QR code scanning" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="font-serif font-bold text-base sm:text-lg">{t.landing.feature_embed}</h3>
                <p className="text-xs sm:text-sm text-white/80">{t.landing.feature_embed_desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 sm:px-6 py-12 sm:py-16 md:py-24 bg-accent/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-center mb-3 sm:mb-4" data-testid="text-features-title">
            {t.landing.features_title}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground text-center mb-8 sm:mb-12 max-w-xl mx-auto">
            {t.landing.hero_tagline}
          </p>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card key={i} className="border-border/50 shadow-sm" data-testid={`card-feature-${i}`}>
                  <CardContent className="pt-5 sm:pt-6 pb-5 sm:pb-6">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-serif font-bold text-base sm:text-lg mb-1.5 sm:mb-2">{feature.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {pricingPlans && pricingPlans.length > 0 && (
        <section className="w-full px-4 sm:px-6 py-12 sm:py-16 md:py-24" data-testid="section-pricing">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-center mb-3 sm:mb-4" data-testid="text-pricing-title">
              {t.pricing.title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-8 sm:mb-12 max-w-xl mx-auto">
              {t.pricing.subtitle}
            </p>

            <div className={`grid gap-6 grid-cols-1 max-w-6xl mx-auto ${pricingPlans.length === 1 ? 'sm:grid-cols-1 max-w-md' : pricingPlans.length === 2 ? 'sm:grid-cols-2 max-w-3xl' : pricingPlans.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3 max-w-5xl' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
              {pricingPlans
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((plan) => getLocalizedPlan(plan, t.pricing))
                .map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${plan.highlighted ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border/50 shadow-sm'}`}
                  data-testid={`card-pricing-${plan.id}`}
                >
                  <CardContent className="pt-6 pb-6 flex flex-col flex-1">
                    {plan.highlighted && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" data-testid={`badge-popular-${plan.id}`}>{t.pricing.popular}</Badge>
                    )}
                    <h3 className="font-serif font-bold text-xl mb-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.pricePer}</span>
                    </div>
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button variant={plan.highlighted ? "default" : "outline"} className="w-full mt-auto" asChild data-testid={`button-pricing-${plan.id}`}>
                      <a href="mailto:contato@mintoria.xyz">
                        {t.pricing.contact}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {pricingLoading && (
        <section className="w-full px-4 sm:px-6 py-12 sm:py-16 md:py-24">
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
          </div>
        </section>
      )}

      <section className="w-full px-4 sm:px-6 py-12 sm:py-16 md:py-24 bg-accent/30" data-testid="section-team">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-3 sm:mb-4" data-testid="text-team-title">
            {t.landing.team_title}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-8 sm:mb-12 max-w-xl mx-auto">
            {t.landing.team_subtitle}
          </p>

          <div className="flex justify-center">
            <div className="flex flex-col items-center max-w-xs" data-testid="card-team-founder">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-4 ring-4 ring-primary/20">
                <img
                  src={founderPhoto}
                  alt="John Rhodel Bartolome"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-serif font-bold text-lg sm:text-xl mb-1" data-testid="text-founder-name">John Rhodel Bartolome</h3>
              <p className="text-sm text-primary font-medium mb-3" data-testid="text-founder-role">{t.landing.team_founder}</p>
              <a
                href="https://www.linkedin.com/in/johnrhodel/"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-founder-linkedin"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <Linkedin className="w-4 h-4" />
                  {t.landing.team_connect}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 sm:px-6 py-12 sm:py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-5 sm:mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {t.landing.try_demo}
          </motion.h2>
          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center flex-wrap"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Link href="/access">
              <Button size="lg" className="w-full sm:w-auto relative overflow-hidden group shadow-lg shadow-primary/25" data-testid="button-access-code">
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <KeyRound className="mr-2 w-5 h-5" />
                {t.accessCode.title}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="w-full px-4 sm:px-6 py-6 sm:py-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Layers className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-serif font-bold text-sm text-foreground">Mintoria</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground" data-testid="text-copyright">
            &copy; 2026 {t.landing.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}
