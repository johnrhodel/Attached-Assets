import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n/context";

export default function NotFound() {
  const { t } = useI18n();
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">404</h1>
          <p className="text-muted-foreground mb-6">
            Page not found
          </p>
          <Link href="/">
            <Button variant="outline" className="gap-2" data-testid="button-go-home">
              <Home className="w-4 h-4" /> {t.nav.home}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
