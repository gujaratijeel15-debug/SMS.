const nodemailer = require('nodemailer');
const buildEmailShell = require('./emailTemplate');

function cleanEnvValue(value) {
  if (!value) return '';
  return String(value).trim().replace(/^['"]|['"]$/g, '').replace(/,$/, '');
}

const smtpUser = cleanEnvValue(process.env.SMTP_USER || process.env.EMAIL_USER);
const smtpPass = cleanEnvValue(process.env.SMTP_PASS || process.env.EMAIL_PASS).replace(/\s+/g, '');
const smtpService = cleanEnvValue(process.env.SMTP_SERVICE || 'gmail');

const transporter = nodemailer.createTransport({
  service: smtpService,
  auth: {
    user: smtpUser,
    pass: smtpPass
  }
});

async function sendSystemEmail({ to, subject, title, subtitle, bodyHtml }) {
  if (!smtpUser || !smtpPass) {
    throw new Error('Email service is not configured');
  }

  await transporter.sendMail({
    from: `"SMS Support" <${smtpUser}>`,
    to,
    subject,
    html: buildEmailShell({
      title,
      subtitle,
      bodyHtml
    })
  });
}

module.exports = sendSystemEmail;
