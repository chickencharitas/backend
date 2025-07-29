import crypto from 'crypto';

function verifyWebhook(req, res, next) {
  const secret = process.env.WEBHOOK_SECRET;
  const signature = req.headers['x-webhook-secret'];
  if (!secret || signature !== secret) {
    return res.status(401).send("Invalid or missing secret.");
  }
  next();
}

app.post('/webhook-endpoint', verifyWebhook, (req, res) => {
  // handle event
  res.sendStatus(200);
});