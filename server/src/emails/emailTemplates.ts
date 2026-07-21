export function createWelcomeEmailTemplate(name: string, clientURL: string): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to PulseChat</title>
  </head>
  <body style="
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #EDEDED;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #0F0C0A;
  ">

    <!-- Header -->
    <div style="
      background: radial-gradient(circle at top right, #FF9F43, #C66A18 45%, #1A120D 100%);
      padding: 32px;
      text-align: center;
      border-radius: 14px 14px 0 0;
    ">
      <img
        src="https://img.freepik.com/free-vector/hand-drawn-message-element-vector-cute-sticker_53876-118344.jpg"
        alt="PulseChat Logo"
        style="
          width: 72px;
          height: 72px;
          margin-bottom: 18px;
          border-radius: 16px;
          background-color: #1E140F;
          padding: 10px;
        "
      />
      <h1 style="
        color: #FFF4E6;
        margin: 0;
        font-size: 26px;
        font-weight: 600;
        letter-spacing: 0.3px;
      ">
        Welcome to PulseChat💫
      </h1>
    </div>

    <!-- Body -->
    <div style="
      background-color: #1A120D;
      padding: 34px;
      border-radius: 0 0 14px 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.45);
    ">

      <p style="font-size: 18px; color: #FFB26B;">
        <strong>Hello ${name},</strong>
      </p>

      <p style="color: #E0E0E0;">
        We're excited to welcome you to PulseChat — a modern messaging platform built for fast, seamless, real-time conversations.
      </p>

      <!-- Steps -->
      <div style="
        background-color: #241812;
        padding: 24px;
        border-radius: 12px;
        margin: 26px 0;
        border-left: 4px solid #FF9F43;
      ">
        <p style="
          font-size: 16px;
          margin: 0 0 14px 0;
          color: #FFD7A3;
        ">
          <strong>Get started quickly:</strong>
        </p>

        <ul style="padding-left: 20px; margin: 0; color: #E6E6E6;">
          <li style="margin-bottom: 10px;">Set up your profile</li>
          <li style="margin-bottom: 10px;">Add your contacts</li>
          <li style="margin-bottom: 10px;">Start chatting instantly</li>
          <li>Share photos, videos, and more</li>
        </ul>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 34px 0;">
        <a
          href="${clientURL}"
          style="
            background: linear-gradient(135deg, #FF9F43, #FF7A18);
            color: #1A120D;
            text-decoration: none;
            padding: 14px 36px;
            border-radius: 999px;
            font-weight: 600;
            display: inline-block;
            box-shadow: 0 6px 18px rgba(255,159,67,0.35);
          "
        >
          Open Messenger
        </a>
      </div>

      <p style="margin-bottom: 6px; color: #D6D6D6;">
        Need help or have questions? Our team is always here for you.
      </p>

      <p style="margin-top: 0; color: #D6D6D6;">
        Happy messaging.
      </p>

      <p style="margin-top: 26px; margin-bottom: 0; color: #BFBFBF;">
        Best regards,<br />
        <strong style="color:#FFD7A3;">The PulseChat💫 Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="
      text-align: center;
      padding: 22px;
      color: #8E8E8E;
      font-size: 12px;
    ">
      <p>© 2026 PulseChat💫. All rights reserved.</p>
      <p>
        <a href="#" style="color: #FF9F43; text-decoration: none; margin: 0 10px;">Privacy</a>
        <a href="#" style="color: #FF9F43; text-decoration: none; margin: 0 10px;">Terms</a>
        <a href="#" style="color: #FF9F43; text-decoration: none; margin: 0 10px;">Contact</a>
      </p>
    </div>

  </body>
  </html>
  `
}
