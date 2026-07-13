import { useI18n } from '@/lib/i18n/context';
import { type Language } from '@/lib/i18n/translations';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const languages: { code: Language; abbr: string; name: string }[] = [
  { code: 'en', abbr: 'EN', name: 'English' },
  { code: 'pt', abbr: 'PT', name: 'Português' },
  { code: 'es', abbr: 'ES', name: 'Español' },
];

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();
  const current = languages.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white/15 backdrop-blur-sm border-white/30 text-white" data-testid="button-language-selector">
          <Globe className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">{current?.abbr}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            data-testid={`menu-item-language-${lang.code}`}
          >
            <span className="mr-2 font-mono text-xs font-bold">{lang.abbr}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
