import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: import.meta.env.BREVO_SMTP_USER,
    pass: import.meta.env.BREVO_SMTP_PASS
  }
});

export async function sendEmail({ to, subject, html }) {
  return await transporter.sendMail({
    from: import.meta.env.BREVO_EMAIL_FROM,
    to,
    subject,
    html
  });
}
