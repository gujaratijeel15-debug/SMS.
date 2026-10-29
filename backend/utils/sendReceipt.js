const nodemailer = require("nodemailer");
const buildEmailShell = require("./emailTemplate");

const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || "";
const smtpPass = String(process.env.SMTP_PASS || process.env.EMAIL_PASS || "").replace(/\s+/g, "");
const smtpService = process.env.SMTP_SERVICE || "gmail";

const sendReceiptEmail = async (userEmail, booking) => {
  if (!smtpUser || !smtpPass) {
    throw new Error("Email service is not configured");
  }

  const transporter = nodemailer.createTransport({
    service: smtpService,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  const receiptDate = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  const mailOptions = {
    from: smtpUser,
    to: userEmail,
    subject: "Payment Receipt - SMS Service",
    html: buildEmailShell({
      title: "Payment Successful",
      subtitle: "Your service receipt is ready",
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:15px;color:#cbd5e1;">
          Thank you for choosing our service platform. Your payment has been confirmed.
        </p>

        <div style="background:#111827;border:1px solid #334155;border-radius:14px;padding:16px;">
          <p style="margin:0 0 10px;"><strong style="color:#22c55e;">Service:</strong> ${booking.serviceName}</p>
          <p style="margin:0 0 10px;"><strong style="color:#22c55e;">Amount:</strong> INR ${booking.price}</p>
          <p style="margin:0 0 10px;"><strong style="color:#22c55e;">Payment Method:</strong> ${booking.paymentMethod}</p>
          <p style="margin:0 0 10px;"><strong style="color:#22c55e;">Payment Status:</strong> ${booking.paymentStatus}</p>
          <p style="margin:0;"><strong style="color:#22c55e;">Date:</strong> ${receiptDate}</p>
        </div>

        <div style="margin-top:18px;padding:14px;border-radius:12px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35);">
          <p style="margin:0;color:#dcfce7;font-style:italic;">
            "Seva se banta hai rishta pyaara,<br>
            aapka bharosa hi hai humara sahara."
          </p>
        </div>
      `
    })
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendReceiptEmail;
