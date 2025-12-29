import nodemailer from 'nodemailer';

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'; // true for 465, false for other ports
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER || 'noreply@pharmadmin.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Pharma Collect';

// Check if email is configured
export const isEmailConfigured = (): boolean => {
  return !!(SMTP_USER && SMTP_PASS);
};

// Create transporter
const createTransporter = () => {
  if (!isEmailConfigured()) {
    console.warn('[EmailService] SMTP not configured. Set SMTP_USER and SMTP_PASS environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email
 */
export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error('[EmailService] Cannot send email - SMTP not configured');
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    
    console.log(`[EmailService] Email sent successfully to ${options.to}`);
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
 * Send pharmacy password reset email (using Supabase's built-in, but this is a fallback)
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

