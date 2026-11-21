import nodemailer from "nodemailer";

import { env } from "../config/env.js";
import logger from "../utils/logger.js";

const transporter =
  env.mail.host && env.mail.user && env.mail.pass
    ? nodemailer.createTransport({
        host: env.mail.host,
        port: env.mail.port,
        secure: env.mail.secure,
        auth: { user: env.mail.user, pass: env.mail.pass },
      })
    : null;

const isMailConfigured = () => Boolean(transporter);

const BRAND = {
  name: "Attendance System",
  primary: "#4f46e5",
  primaryDark: "#4338ca",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#f3f4f6",
  card: "#ffffff",
  year: new Date().getFullYear(),
};

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const button = (label, href) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td align="center" bgcolor="${BRAND.primary}" style="border-radius:8px;">
        <a href="${href}"
           target="_blank"
           style="display:inline-block;padding:14px 32px;font-family:${FONT};
                  font-size:16px;font-weight:600;line-height:1;color:#ffffff;
                  text-decoration:none;border-radius:8px;
                  background-color:${BRAND.primary};">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;

const linkFallback = (href) => `
  <p style="margin:24px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${BRAND.muted};">
    Jika tombol tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:
  </p>
  <p style="margin:6px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;
            word-break:break-all;">
    <a href="${href}" target="_blank" style="color:${BRAND.primary};">${href}</a>
  </p>`;

const layout = ({ title, intro = [], cta, outro = [] }) => {
  const paragraph = (text) => `
    <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.7;
              color:${BRAND.text};">${text}</p>`;

  const introHtml = intro.map(paragraph).join("");
  const outroHtml = outro.map(paragraph).join("");
  const ctaHtml = cta
    ? `<div style="margin:28px 0;">${button(cta.label, cta.href)}</div>${linkFallback(cta.href)}`
    : "";

  return `
  <!DOCTYPE html>
  <html lang="id" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${BRAND.bg};">
    <!-- preheader: teks preview di inbox, disembunyikan dari body -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${title} — ${BRAND.name}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background-color:${BRAND.bg};">
      <tr>
        <td align="center" style="padding:32px 16px;">

          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
                 style="width:600px;max-width:100%;">

            <tr>
              <td align="center" style="padding:0 0 20px;">
                <span style="font-family:${FONT};font-size:18px;font-weight:700;
                             letter-spacing:.3px;color:${BRAND.primary};">
                  ${BRAND.name}
                </span>
              </td>
            </tr>

            <tr>
              <td style="background-color:${BRAND.card};border:1px solid ${BRAND.border};
                         border-radius:12px;padding:40px;">
                <h1 style="margin:0 0 20px;font-family:${FONT};font-size:22px;
                           font-weight:700;line-height:1.3;color:${BRAND.text};">
                  ${title}
                </h1>
                ${introHtml}
                ${ctaHtml}
                ${outroHtml}
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:24px 16px 0;">
                <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;
                          color:${BRAND.muted};">
                  Email ini dikirim otomatis oleh ${BRAND.name}. Mohon jangan membalas.
                </p>
                <p style="margin:6px 0 0;font-family:${FONT};font-size:12px;
                          color:${BRAND.muted};">
                  © ${BRAND.year} ${BRAND.name}. Seluruh hak cipta dilindungi.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
};

const sendMail = async ({ to, subject, html }) => {
  if (!transporter) throw new Error("SMTP belum di-set");
  const info = await transporter.sendMail({
    from: env.mail.from,
    to,
    subject,
    html,
  });
  logger.info(`email sent to ${to}: ${info.messageId}`);
  return info;
};

const sendPasswordResetEmail = async (to, token, expiresAt) => {
  const link = `${env.mail.resetUrlBase}?token=${token}`;
  const expiresText = expiresAt
    ? `Link berlaku sampai <strong>${expiresAt.toLocaleString("id-ID")}</strong>.`
    : "Link berlaku sementara waktu.";

  return sendMail({
    to,
    subject: "Reset Password — Attendance System",
    html: layout({
      title: "Reset Password",
      intro: [
        "Halo,",
        "Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah untuk membuat password baru.",
      ],
      cta: { label: "Reset Password", href: link },
      outro: [
        `${expiresText} Abaikan email ini jika Anda tidak meminta reset password — akun Anda tetap aman.`,
      ],
    }),
  });
};

const sendAccountInvitationEmail = async (to, token, expiresAt) => {
  const link = `${env.mail.resetUrlBase}?token=${token}&welcome=1`;
  const expiresText = expiresAt
    ? `Tautan berlaku sampai <strong>${expiresAt.toLocaleString("id-ID")}</strong>.`
    : "Tautan berlaku sementara waktu.";

  return sendMail({
    to,
    subject: "Selamat Datang — Atur Password Akun Anda",
    html: layout({
      title: `Selamat Datang di ${BRAND.name}`,
      intro: [
        "Halo,",
        "Akun Anda telah dibuat oleh admin. Demi keamanan, Anda saat ini menggunakan password default — kami sangat menyarankan Anda segera menggantinya dengan password pribadi.",
        "Klik tombol di bawah untuk mengatur password baru:",
      ],
      cta: { label: "Atur Password", href: link },
      outro: [
        `${expiresText} Jika tautan kedaluwarsa, Anda tetap bisa login dengan password dari admin lalu menggantinya dari menu profil, atau gunakan fitur "Lupa password".`,
      ],
    }),
  });
};

export default {
  sendMail,
  sendPasswordResetEmail,
  sendAccountInvitationEmail,
  isMailConfigured,
};
