import { env } from "../config/env.js";
import { AppError } from "../http/errors.js";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface StaffInvitationData {
  staffName: string;
  schoolName: string;
  role: string;
  email: string;
  setupLink?: string;
  tempPassword?: string;
}

function formatRole(role: string): string {
  const roleLabels: Record<string, string> = {
    HEADTEACHER: "Headteacher",
    SCHOOL_ADMIN: "School Administrator",
    TEACHER: "Teacher",
    ACCOUNTANT: "Accountant",
    DISCIPLINE_OFFICER: "Discipline Officer",
    LIBRARIAN: "Librarian",
    ICT_OFFICER: "ICT Officer",
    RECEPTIONIST: "Receptionist",
    SUPPORT_STAFF: "Support Staff",
  };
  return roleLabels[role] || role;
}

function generateStaffInvitationHtml(data: StaffInvitationData): string {
  const greeting = data.staffName ? `Dear ${data.staffName}` : "Dear Staff Member";
  const role = formatRole(data.role);
  
  let credentialsSection = "";
  if (data.setupLink) {
    credentialsSection = `
      <p style="margin: 20px 0;">
        <strong>Click the button below to set up your account:</strong>
      </p>
      <p style="margin: 30px 0;">
        <a href="${data.setupLink}" style="background-color: #6d3eeb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Set Up Your Account
        </a>
      </p>
      <p style="color: #666; font-size: 13px;">
        Or copy this link: ${data.setupLink}
      </p>
    `;
  } else if (data.tempPassword) {
    credentialsSection = `
      <p style="margin: 20px 0;">
        <strong>Your temporary login credentials:</strong>
      </p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${data.tempPassword}</p>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6d3eeb 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">KuraLearn</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Welcome to ${data.schoolName}</p>
      </div>
      
      <div style="background-color: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p>${greeting},</p>
        
        <p>You have been added as <strong>${role}</strong> at <strong>${data.schoolName}</strong>.</p>
        
        ${credentialsSection}
        
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          <strong>Important:</strong> Please change your password after your first login.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #666; font-size: 13px;">
          If you have any questions, please contact the school administration.
        </p>
        
        <p style="color: #888; font-size: 12px; margin-top: 30px;">
          This is an automated message from KuraLearn. Please do not reply directly to this email.
        </p>
      </div>
    </body>
    </html>
  `;
}

function generateStaffInvitationText(data: StaffInvitationData): string {
  const greeting = data.staffName ? `Dear ${data.staffName}` : "Dear Staff Member";
  const role = formatRole(data.role);
  
  let credentialsSection = "";
  if (data.setupLink) {
    credentialsSection = `Click the link below to set up your account:\n${data.setupLink}\n`;
  } else if (data.tempPassword) {
    credentialsSection = `Your temporary login credentials:\nEmail: ${data.email}\nTemporary Password: ${data.tempPassword}\n`;
  }

  return `
${greeting},

You have been added as ${role} at ${data.schoolName}.

${credentialsSection}
Important: Please change your password after your first login.

If you have any questions, please contact the school administration.

This is an automated message from KuraLearn.
  `.trim();
}

export async function sendStaffInvitationEmail(data: StaffInvitationData): Promise<void> {
  if (env.NODE_ENV === "test") {
    console.log("[Email Service] Would send invitation email to:", data.email);
    return;
  }

  const html = generateStaffInvitationHtml(data);
  const text = generateStaffInvitationText(data);

  if (!env.SMTP_HOST) {
    console.warn("[Email Service] SMTP not configured. Logging email instead.");
    console.log("[Email Service] To:", data.email);
    console.log("[Email Service] Subject: Welcome to KuraLearn - Set Up Your Account");
    console.log("[Email Service] Body preview:", text.substring(0, 200));
    return;
  }

  try {
    const nodemailer = await import("nodemailer");
    
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_SECURE || false,
      auth: env.SMTP_USER ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      } : undefined,
    });

    await transporter.sendMail({
      from: env.SMTP_FROM || "KuraLearn <noreply@kuralearn.com>",
      to: data.email,
      subject: `Welcome to KuraLearn - Set Up Your Account`,
      html,
      text,
    });

    console.log("[Email Service] Invitation email sent to:", data.email);
  } catch (error) {
    console.error("[Email Service] Failed to send email:", error);
    throw new AppError(500, "Failed to send invitation email", "EMAIL_SEND_FAILED");
  }
}

export async function sendPasswordResetEmail(data: { to: string; name: string; resetLink: string }): Promise<void> {
  const subject = "Reset your KuraLearn password";
  const text = `Hello ${data.name},\n\nUse this link to choose a new KuraLearn password. It works once and expires in one hour:\n${data.resetLink}\n\nIf you did not ask for this, you can ignore this email. Your password has not changed.`;

  if (!env.SMTP_HOST) {
    // Only development may print the link; elsewhere it would put a working login credential in the logs.
    console.warn("[Email Service] SMTP not configured. Password reset email was not sent to:", data.to);
    if (env.NODE_ENV !== "production") console.log("[Email Service] Password reset link:", data.resetLink);
    return;
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
  });
  await transporter.sendMail({ from: env.SMTP_FROM, to: data.to, subject, text });
}
