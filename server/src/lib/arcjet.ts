import arcjet, { shield, detectBot, slidingWindow } from '@arcjet/node';
import { ENV } from './env.js';

if (!ENV.ARCJET_KEY) {
  throw new Error('Missing required environment variable: ARCJET_KEY');
}

const mode = ENV.NODE_ENV === 'production' ? 'LIVE' : 'DRY_RUN';

const aj = arcjet({
  key: ENV.ARCJET_KEY,
  rules: [
    shield({ mode }),
    detectBot({
      mode,
      allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:MONITOR'],
    }),
    slidingWindow({
      mode,
      max: 100,
      interval: 60,
    }),
  ],
});

export default aj;
