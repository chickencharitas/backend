import webpush from "web-push";
// ...other imports for email, SMS, WhatsApp

export const sendPush = async ({ subscription, title, body }) => {
  await webpush.sendNotification(
    subscription,
    JSON.stringify({ title, body })
  );
};