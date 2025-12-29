import { Resend } from 'resend';

// Resend configuration (Supabase's recommended email service)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Pharma Collect <noreply@pharmadmin.com>';

// Initialize Resend client
let resend: Resend | null = null;

if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
}

/**
 * Check if email service is configured
 */
export const isEmailConfigured = (): boolean => {
  return !!RESEND_API_KEY;
};

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using Resend (Supabase's recommended email service)
 */
export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  if (!resend) {
    console.error('[EmailService] Cannot send email - RESEND_API_KEY not configured');
    return false;
  }

  try {
    // Build the email payload with proper types
    const emailPayload: {
      from: string;
      to: string;
      subject: string;
      text?: string;
      html?: string;
    } = {
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
    };

    // Add text and html if provided
    if (options.text) emailPayload.text = options.text;
    if (options.html) emailPayload.html = options.html;

    const { data, error } = await resend.emails.send(emailPayload as any);

    if (error) {
      console.error('[EmailService] Resend error:', error);
      return false;
    }

    console.log(`[EmailService] Email sent successfully to ${options.to}, ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('[EmailService] Failed to send email:', error);
    return false;
  }
};

/**
 * Send admin password reset email
 */
export const sendAdminPasswordResetEmail = async (
  email: string,
  name: string,
  resetLink: string
): Promise<boolean> => {
  const subject = 'Reset Your Admin Password - Pharma Collect';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
        </div>
        
        <div style="background-color: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
          
          <p style="color: #666; font-size: 15px;">
            We received a request to reset your admin account password. Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              Reset Password
            </a>
          </div>
          
          <p style="color: #888; font-size: 13px; margin-top: 20px;">
            Or copy and paste this link into your browser:
            <br>
            <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 13px;">
            ⏰ This link will expire in <strong>1 hour</strong>.
            <br><br>
            If you didn't request this password reset, please ignore this email or contact support if you have concerns.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Pharma Collect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello ${name},

We received a request to reset your admin account password.

Click this link to reset your password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

© ${new Date().getFullYear()} Pharma Collect. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
};

/**
 * Send pharmacy password reset email
 */
export const sendPharmacyPasswordResetEmail = async (
  email: string,
  name: string,
  resetLink: string
): Promise<boolean> => {
  const subject = 'Reset Your Password - Pharma Collect';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
        </div>
        
        <div style="background-color: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
          
          <p style="color: #666; font-size: 15px;">
            We received a request to reset your pharmacy account password. Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
              Reset Password
            </a>
          </div>
          
          <p style="color: #888; font-size: 13px; margin-top: 20px;">
            Or copy and paste this link into your browser:
            <br>
            <a href="${resetLink}" style="color: #10b981; word-break: break-all;">${resetLink}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 13px;">
            ⏰ This link will expire in <strong>1 hour</strong>.
            <br><br>
            If you didn't request this password reset, please ignore this email or contact support if you have concerns.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Pharma Collect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello ${name},

We received a request to reset your pharmacy account password.

Click this link to reset your password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

© ${new Date().getFullYear()} Pharma Collect. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
};
