import { Link } from "wouter";
import { useState, useEffect } from "react";
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
  ChevronRight,
  Linkedin
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

export default function Home() {
  const { t } = useI18n();
  const [currentImage, setCurrentImage] = useState(0);

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
            <Button variant="outline" size="sm" className="bg-white/10 backdrop-blur-sm border-white/20 text-white" data-testid="link-admin-login">
              {t.landing.admin_portal}
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
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center flex-wrap">
            <Link href="/claim/1">
              <Button size="lg" className="w-full sm:w-auto" data-testid="button-try-demo">
                {t.landing.try_demo} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border-white/30 text-white" data-testid="button-admin-portal">
                {t.landing.admin_portal} <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div className="flex justify-center gap-2 mt-8 sm:mt-10">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
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

      <section className="w-full px-4 sm:px-6 py-12 sm:py-16 md:py-24" data-testid="section-team">
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

      <section className="w-full px-4 sm:px-6 py-12 sm:py-16 md:py-24 bg-accent/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-5 sm:mb-6">
            {t.landing.try_demo}
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center flex-wrap">
            <Link href="/claim/1">
              <Button size="lg" className="w-full sm:w-auto" data-testid="button-cta-demo">
                {t.landing.try_demo} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
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
