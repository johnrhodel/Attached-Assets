const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Mintoria <onboarding@resend.dev>";

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
    await client.emails.send({
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
    console.log(`[EMAIL] Verification code sent to ${email} via Resend`);
    return true;
  } catch (err: any) {
    console.error(`[EMAIL] Failed to send via Resend: ${err.message}`);
    console.log(`[WALLETLESS] Verification code for ${email}: ${code} (fallback to console)`);
    return true;
  }
}

export async function sendMintConfirmationEmail(email: string, params: { dropTitle: string; chain: string; txHash: string; explorerUrl: string }): Promise<boolean> {
  const client = await getResendClient();
  
  if (!client) {
    console.log(`[EMAIL] Mint confirmation for ${email}: ${params.dropTitle} on ${params.chain}`);
    return true;
  }

  try {
    await client.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Your NFT "${params.dropTitle}" has been minted!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; font-weight: bold; color: #1a1a1a; margin: 0;">Mintoria</h1>
          </div>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 32px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">&#10003;</div>
            <h2 style="color: #166534; font-size: 20px; margin: 0 0 8px;">NFT Minted Successfully!</h2>
            <p style="color: #333; font-size: 16px; margin: 0 0 16px;">${params.dropTitle}</p>
            <p style="color: #666; font-size: 13px;">Chain: ${params.chain}</p>
            <a href="${params.explorerUrl}" style="display: inline-block; margin-top: 16px; padding: 10px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
              View on Explorer
            </a>
          </div>
          <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 24px;">
            &copy; 2026 Mintoria. All rights reserved.
          </p>
        </div>
      `,
    });
    console.log(`[EMAIL] Mint confirmation sent to ${email} via Resend`);
    return true;
  } catch (err: any) {
    console.error(`[EMAIL] Failed to send mint confirmation: ${err.message}`);
    return false;
  }
}
