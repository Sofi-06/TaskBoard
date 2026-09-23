import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export function brandedEmail(title: string, content: string, button?: { label: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f6f1e9;font-family:Arial,sans-serif;color:#30261f"><div style="max-width:600px;margin:32px auto;background:#fffdf8;border:2px solid #30261f;border-radius:18px;overflow:hidden;box-shadow:6px 6px 0 #30261f"><div style="padding:24px 30px;background:#ff7d2b;color:#fff;font-size:25px;font-weight:700">TaskBoard</div><div style="padding:34px 30px"><h1 style="margin:0 0 18px;font-size:28px">${title}</h1><div style="font-size:16px;line-height:1.7">${content}</div>${button ? `<p style="margin:28px 0"><a href="${button.url}" style="display:inline-block;padding:13px 20px;border:2px solid #30261f;border-radius:10px;background:#ff7d2b;color:#fff;text-decoration:none;font-weight:700;box-shadow:4px 4px 0 #30261f">${button.label}</a></p>` : ''}<p style="margin-top:30px;color:#987961;font-size:13px">Este mensaje fue enviado por TaskBoard.</p></div></div></body></html>`;
}

@Injectable()
export class MailService {
  private transporter() { const host = process.env.SMTP_HOST; const port = Number(process.env.SMTP_PORT || 587); const user = process.env.SMTP_USER; const pass = process.env.SMTP_PASS; if (!host || !user || !pass) throw new ServiceUnavailableException('Falta configurar SMTP_HOST, SMTP_USER y SMTP_PASS'); return nodemailer.createTransport({ host, port, secure: process.env.SMTP_SECURE === 'true', auth: { user, pass } }); }
  async send(to: string, subject: string, html: string) { const user = process.env.SMTP_USER; const fromName = process.env.SMTP_FROM_NAME || 'TaskBoard'; await this.transporter().sendMail({ from: `"${fromName}" <${user}>`, to, subject, html }); }
}
