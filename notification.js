const nodemailer = require("nodemailer");
const mustache = require("mustache");
const fs = require("fs");

const XSS_PAYLOAD_FIRE_EMAIL_TEMPLATE = fs.readFileSync(
  "./templates/xss_email_template.htm",
  "utf8"
);

function sendDiscordWebhook(xss_payload_fire_data) {
  if (!process.env.DISCORD_WEBHOOK_URL)
    fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `New XSS vulnerability found on ${xss_payload_fire_data.url}, UUID: ${xss_payload_fire_data.id}`,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to send message to Discord webhook");
        }

        console.log("Message sent successfully to Discord webhook");
      })
      .catch((error) => {
        console.error("Error:", error);
      });
}

async function send_email_notification(xss_payload_fire_data) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_USE_TLS === "true",
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const notification_html_email_body = mustache.render(
    XSS_PAYLOAD_FIRE_EMAIL_TEMPLATE,
    xss_payload_fire_data
  );

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    to: process.env.SMTP_RECEIVER_EMAIL,
    subject: `[XSS Hunter Express] XSS Payload Fired On ${xss_payload_fire_data.url}`,
    text: "Only HTML reports are available, please use an email client which supports this.",
    html: notification_html_email_body,
  });

  console.log("Message sent: %s", info.messageId);
}

module.exports.send_email_notification = send_email_notification;
module.exports.sendDiscordWebhook = sendDiscordWebhook;
