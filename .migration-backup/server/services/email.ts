const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Mintoria <noreply@mintoria.xyz>";

let resendClient: any = null;

async function getResendClient() {
  if (!RESEND_API_KEY) return null;
  if (resendClient) return resendClient;
  try {
    const { Resend } = await import("resend");
    resendClient = new Resend(RESEND_API_KEY);
    return resendClient;
  } catch {
    console.warn("[EMAIL] Resend package not available, falling back to console");
    return null;
  }
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const client = await getResendClient();

  if (!client) {
    console.log(`[WALLETLESS] Verification code for ${email}: ${code}`);
    return true;
  }

  try {
    const result = await client.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Your Mintoria verification code: ${code}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; font-weight: bold; color: #1a1a1a; margin: 0;">Mintoria</h1>
            <p style="color: #666; font-size: 14px; margin-top: 4px;">Your memories, eternalized</p>
          </div>
          <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; text-align: center;">
            <p style="color: #333; font-size: 16px; margin: 0 0 16px;">Your verification code is:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; font-family: monospace; padding: 16px; background: white; border-radius: 8px; display: inline-block;">
              ${code}
            </div>
            <p style="color: #888; font-size: 13px; margin-top: 20px;">This code expires in 5 minutes. Don't share it with anyone.</p>
          </div>
          <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 24px;">
            &copy; 2026 Mintoria. All rights reserved.
          </p>
        </div>
      `,
    });
    if (result.error) {
      console.error(`[EMAIL] Resend API error for ${email}:`, JSON.stringify(result.error));
      console.log(`[WALLETLESS] Verification code for ${email}: ${code} (Resend error fallback)`);
    } else {
      console.log(`[EMAIL] Verification code sent to ${email} via Resend (id: ${result.data?.id})`);
    }
    return true;
  } catch (err: any) {
    console.error(`[EMAIL] Failed to send via Resend:`, err.message, err.statusCode || '', JSON.stringify(err.response?.body || ''));
    console.log(`[WALLETLESS] Verification code for ${email}: ${code} (fallback to console)`);
    return true;
  }
}

export type EmailLocale = "en" | "pt" | "es";

type MintEmailStrings = {
  subject: string;
  preheader: string;
  heading: string;
  congrats: string;
  tagline: string;
  detailsTitle: string;
  location: string;
  mintedOn: string;
  chain: string;
  attributesTitle: string;
  ctaExplorer: string;
  ctaShare: string;
  shareSubject: string;
  shareBody: string;
  footerNote: string;
  rights: string;
};

const MINT_EMAIL_I18N: Record<EmailLocale, MintEmailStrings> = {
  en: {
    subject: 'Your NFT "{title}" has been minted!',
    preheader: "Your memory is now on-chain forever.",
    heading: "Your memory is eternal",
    congrats: "Congrats! Your NFT was successfully minted.",
    tagline: "Your memories, eternalized.",
    detailsTitle: "Mint details",
    location: "Location",
    mintedOn: "Minted on",
    chain: "Chain",
    attributesTitle: "Highlights",
    ctaExplorer: "View my NFT on Explorer",
    ctaShare: "Share",
    shareSubject: "I just minted an NFT on Mintoria!",
    shareBody: "Check out my new NFT from {title}: {url}",
    footerNote: "You received this email because you minted an NFT on Mintoria.",
    rights: "All rights reserved.",
  },
  pt: {
    subject: 'Seu NFT "{title}" foi mintado!',
    preheader: "Sua memória agora está eternizada na blockchain.",
    heading: "Sua memória é eterna",
    congrats: "Parabéns! Seu NFT foi mintado com sucesso.",
    tagline: "Suas memórias, eternizadas.",
    detailsTitle: "Detalhes do mint",
    location: "Local",
    mintedOn: "Mintado em",
    chain: "Rede",
    attributesTitle: "Destaques",
    ctaExplorer: "Ver meu NFT no Explorer",
    ctaShare: "Compartilhar",
    shareSubject: "Acabei de mintar um NFT na Mintoria!",
    shareBody: "Olha meu novo NFT de {title}: {url}",
    footerNote: "Você recebeu este email porque mintou um NFT na Mintoria.",
    rights: "Todos os direitos reservados.",
  },
  es: {
    subject: '¡Tu NFT "{title}" ha sido acuñado!',
    preheader: "Tu recuerdo ya está eternizado en la blockchain.",
    heading: "Tu recuerdo es eterno",
    congrats: "¡Felicidades! Tu NFT fue acuñado con éxito.",
    tagline: "Tus recuerdos, eternizados.",
    detailsTitle: "Detalles del mint",
    location: "Ubicación",
    mintedOn: "Acuñado el",
    chain: "Red",
    attributesTitle: "Destacados",
    ctaExplorer: "Ver mi NFT en el Explorer",
    ctaShare: "Compartir",
    shareSubject: "¡Acabo de acuñar un NFT en Mintoria!",
    shareBody: "Mira mi nuevo NFT de {title}: {url}",
    footerNote: "Recibiste este email porque acuñaste un NFT en Mintoria.",
    rights: "Todos los derechos reservados.",
  },
};

const MONTH_NAMES: Record<EmailLocale, string[]> = {
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  pt: ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],
  es: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
};

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMonth(month: string, locale: EmailLocale): string {
  const idx = parseInt(month, 10);
  if (!isNaN(idx) && idx >= 1 && idx <= 12) {
    return MONTH_NAMES[locale][idx - 1];
  }
  return month;
}

function normalizeLocale(input?: string): EmailLocale {
  const l = (input || "").toLowerCase().slice(0, 2);
  if (l === "pt" || l === "es") return l;
  return "en";
}

function buildShareUrl(title: string, url: string, t: MintEmailStrings): string {
  const text = t.shareBody.replace("{title}", title).replace("{url}", url);
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export type MintConfirmationParams = {
  dropTitle: string;
  chain: string;
  txHash: string;
  explorerUrl: string;
  imageUrl?: string;
  locationName?: string;
  month?: string;
  year?: number;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  mintedAt?: Date;
  locale?: string;
  shareUrl?: string;
};

const DATE_LOCALES: Record<EmailLocale, string> = {
  en: "en-US",
  pt: "pt-BR",
  es: "es-ES",
};

function renderMintEmailHtml(params: MintConfirmationParams, locale: EmailLocale): string {
  const t = MINT_EMAIL_I18N[locale];
  const title = escapeHtml(params.dropTitle);
  const image = params.imageUrl && /^https?:\/\//i.test(params.imageUrl) ? params.imageUrl : "";
  const location = params.locationName ? escapeHtml(params.locationName) : "";
  const monthLabel = params.month ? escapeHtml(formatMonth(params.month, locale)) : "";
  const year = params.year ? String(params.year) : "";
  let dateLine = [monthLabel, year].filter(Boolean).join(" ");
  if (params.mintedAt) {
    try {
      dateLine = escapeHtml(
        new Intl.DateTimeFormat(DATE_LOCALES[locale], {
          day: "2-digit", month: "long", year: "numeric",
        }).format(params.mintedAt)
      );
    } catch {}
  }
  const chainLabel = escapeHtml(
    params.chain ? params.chain.charAt(0).toUpperCase() + params.chain.slice(1) : ""
  );
  const explorerUrl = params.explorerUrl || "#";
  const shareUrl = params.shareUrl || buildShareUrl(params.dropTitle, explorerUrl, t);

  // Skip only attributes that are already shown in the details table to avoid
  // duplication. Anything else (Collection, Platform, custom traits, etc.) is
  // surfaced as a "Highlights" pill so the email always has rich content.
  const detailKeys = new Set(["location", "month", "year", "chain"]);
  const filteredAttrs = (params.attributes || []).filter(a => {
    const k = (a.trait_type || "").toLowerCase();
    if (detailKeys.has(k)) return false;
    const v = String(a.value ?? "").trim();
    return v.length > 0;
  }).slice(0, 6);

  const attrsHtml = filteredAttrs.length === 0 ? "" : `
    <div style="margin-top:20px;">
      <p style="margin:0 0 8px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${escapeHtml(t.attributesTitle)}</p>
      <div style="display:block;">
        ${filteredAttrs.map(a => `
          <span style="display:inline-block;background:#f1f5f9;color:#0f172a;font-size:12px;padding:6px 10px;border-radius:999px;margin:0 6px 6px 0;">
            <strong>${escapeHtml(a.trait_type)}:</strong> ${escapeHtml(String(a.value))}
          </span>
        `).join("")}
      </div>
    </div>
  `;

  const imageBlock = image ? `
    <div style="background:#0f172a;text-align:center;padding:24px;">
      <img src="${image}" alt="${title}" width="480" style="display:block;max-width:100%;width:100%;height:auto;border-radius:12px;margin:0 auto;border:0;outline:none;text-decoration:none;" />
    </div>
  ` : "";

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(t.subject.replace("{title}", params.dropTitle))}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
<div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">${escapeHtml(t.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
        <tr>
          <td style="padding:28px 32px 8px;text-align:center;">
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">Mintoria</h1>
            <p style="margin:4px 0 0;color:#64748b;font-size:13px;">${escapeHtml(t.tagline)}</p>
          </td>
        </tr>
        <tr><td style="padding:0 16px;">${imageBlock}</td></tr>
        <tr>
          <td style="padding:24px 32px 8px;text-align:center;">
            <p style="margin:0 0 6px;color:#16a34a;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(t.heading)}</p>
            <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">${title}</h2>
            <p style="margin:0;color:#475569;font-size:15px;line-height:1.5;">${escapeHtml(t.congrats)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 0;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;">
              <p style="margin:0 0 12px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${escapeHtml(t.detailsTitle)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#0f172a;">
                ${location ? `<tr><td style="padding:4px 0;color:#64748b;width:40%;">${escapeHtml(t.location)}</td><td style="padding:4px 0;text-align:right;font-weight:500;">${location}</td></tr>` : ""}
                ${dateLine ? `<tr><td style="padding:4px 0;color:#64748b;">${escapeHtml(t.mintedOn)}</td><td style="padding:4px 0;text-align:right;font-weight:500;">${escapeHtml(dateLine)}</td></tr>` : ""}
                ${chainLabel ? `<tr><td style="padding:4px 0;color:#64748b;">${escapeHtml(t.chain)}</td><td style="padding:4px 0;text-align:right;font-weight:500;">${chainLabel}</td></tr>` : ""}
              </table>
              ${attrsHtml}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 8px;text-align:center;">
            <a href="${escapeHtml(explorerUrl)}" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;margin:6px 6px;" data-testid="link-explorer">
              ${escapeHtml(t.ctaExplorer)}
            </a>
            <a href="${escapeHtml(shareUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;margin:6px 6px;" data-testid="link-share">
              ${escapeHtml(t.ctaShare)}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 28px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">${escapeHtml(t.footerNote)}</p>
            <p style="margin:8px 0 0;color:#cbd5e1;font-size:11px;">&copy; 2026 Mintoria. ${escapeHtml(t.rights)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function renderMintEmailText(params: MintConfirmationParams, locale: EmailLocale): string {
  const t = MINT_EMAIL_I18N[locale];
  const lines: string[] = [];
  lines.push(`Mintoria — ${t.tagline}`);
  lines.push("");
  lines.push(`${t.congrats}`);
  lines.push(`${params.dropTitle}`);
  if (params.locationName) lines.push(`${t.location}: ${params.locationName}`);
  if (params.month || params.year) {
    const m = params.month ? formatMonth(params.month, locale) : "";
    lines.push(`${t.mintedOn}: ${[m, params.year ? String(params.year) : ""].filter(Boolean).join(" ")}`);
  }
  if (params.chain) lines.push(`${t.chain}: ${params.chain}`);
  if (params.explorerUrl) lines.push(`${t.ctaExplorer}: ${params.explorerUrl}`);
  return lines.join("\n");
}

export async function sendMintConfirmationEmail(email: string, params: MintConfirmationParams): Promise<boolean> {
  const client = await getResendClient();
  const locale = normalizeLocale(params.locale);
  const t = MINT_EMAIL_I18N[locale];
  const subject = t.subject.replace("{title}", params.dropTitle);

  if (!client) {
    console.log(`[EMAIL] Mint confirmation for ${email}: ${params.dropTitle} on ${params.chain} (${locale})`);
    return true;
  }

  try {
    const result = await client.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject,
      html: renderMintEmailHtml(params, locale),
      text: renderMintEmailText(params, locale),
    });
    if (result.error) {
      console.error(`[EMAIL] Resend API error for mint confirmation to ${email}:`, JSON.stringify(result.error));
      return false;
    }
    console.log(`[EMAIL] Mint confirmation sent to ${email} via Resend (id: ${result.data?.id}, locale: ${locale})`);
    return true;
  } catch (err: any) {
    console.error(`[EMAIL] Failed to send mint confirmation:`, err.message, JSON.stringify(err.response?.body || ''));
    return false;
  }
}
