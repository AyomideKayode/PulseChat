import express from 'express';

const router = express.Router();

router.get('/send', (req, res) => {
  res.send('Send Message Endpoint');
});

router.get('/receive', (req, res) => {
  res.send('Receive Message Endpoint');
});

export default router;
