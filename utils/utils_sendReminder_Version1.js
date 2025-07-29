import nodemailer from "nodemailer";
import twilio from "twilio";
import fetch from "node-fetch";

// Email
export const sendEmail = async ({ to, subject, text }) => {
  let transporter = nodemailer.createTransport({/* ...SMTP config... */});
  await transporter.sendMail({ from: "no-reply@yourfarm.com", to, subject, text });
};

// SMS (Twilio)
export const sendSMS = async ({ to, text }) => {
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  await client.messages.create({ body: text, to, from: process.env.TWILIO_FROM });
};

// WhatsApp (Meta Cloud API)
export const sendWhatsApp = async ({ to, text }) => {
  await fetch("https://graph.facebook.com/v19.0/<your_whatsapp_number_id>/messages", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text }
    })
  });
};