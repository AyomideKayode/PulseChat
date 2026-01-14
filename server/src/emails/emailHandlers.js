import { resendClient, sender } from '../lib/resend.js';
import { createWelcomeEmailTemplate } from '../emails/emailTemplates.js';

export const sendWelcomeEmail = async (email, name, clientURL) => {
  if (!sender?.email || !sender?.name) {
    throw new Error('Sender email or name is not configured properly');
  }
  if (!email) throw new Error('Recipient email is required to send welcome email');
  if (!name) throw new Error('Recipient name is required to send welcome email');

  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: 'Welcome to PulseChat! 💫',
    html: createWelcomeEmailTemplate(name, clientURL),
  });

  if (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }

  console.log('Welcome email sent successfully', data);
};
