function buildEmailShell({ title, subtitle = '', bodyHtml = '' }) {
  return `
    <div style="background:#f1f5f9;padding:24px 12px;font-family:Segoe UI,Arial,sans-serif;">
      <div style="max-width:620px;margin:0 auto;background:#0b1220;border-radius:20px;overflow:hidden;border:1px solid #1e293b;">
        <div style="padding:18px 24px;background:#050b16;border-bottom:1px solid #1e293b;">
          <span style="font-size:26px;font-weight:800;letter-spacing:0.5px;color:#ffffff;">
            SMS<span style="color:#22c55e;">.</span>
          </span>
        </div>

        <div style="padding:28px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#04140b;">
          <h1 style="margin:0;font-size:28px;line-height:1.2;">${title}</h1>
          ${subtitle ? `<p style="margin:8px 0 0;font-size:14px;font-weight:600;">${subtitle}</p>` : ''}
        </div>

        <div style="padding:24px;color:#e2e8f0;">
          ${bodyHtml}

          <p style="margin:18px 0 0;font-size:13px;color:#94a3b8;">
            Thank you for trusting SMS Service Platform.
          </p>
        </div>
      </div>
    </div>
  `;
}

module.exports = buildEmailShell;
