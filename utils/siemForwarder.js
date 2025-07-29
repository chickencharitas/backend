import fetch from 'node-fetch';
export async function forwardToSIEM(event) {
  await fetch(process.env.SIEM_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
}