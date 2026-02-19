import arcjet, { shield, detectBot, slidingWindow } from '@arcjet/node';
import { ENV } from './env.js';

if (!ENV.ARCJET_KEY) {
  throw new Error('Missing required environment variable: ARCJET_KEY');
}

const aj = arcjet({
  key: ENV.ARCJET_KEY,
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: 'LIVE' }),
    // Create a bot detection rule
    detectBot({
      mode: 'LIVE', // Blocks requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        'CATEGORY:SEARCH_ENGINE', // Google, Bing, etc
        "CATEGORY:MONITOR", // Uptime monitoring services
        // Uncomment to allow these other common bot categories
        // See the full list at https://arcjet.com/bot-list
        //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
      ],
    }),
    // Create a sliding window rate limit. Other algorithms are supported.
    slidingWindow({
      mode: 'LIVE', // Blocks requests. Use "DRY_RUN" to log only
      max: 100, // Max 100 requests
      interval: 60, // Per 60 seconds per IP address
    }),
  ],
});

export default aj;
