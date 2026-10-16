import { NotificationLog } from '../models/NotificationLog';
import { env } from '../config/env';

export interface EmailPayload {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface SmsPayload {
  to: string;
  template: string;
  message: string;
}

export class NotificationService {
  /**
   * Send Email Notification
   */
  public static async sendEmail(payload: EmailPayload): Promise<boolean> {
    try {
      if (env.EMAIL_PROVIDER === 'CONSOLE' || env.NODE_ENV === 'test') {
        console.log(`[Notification:EMAIL] To: ${payload.to} | Subject: ${payload.subject}`);
      }

      await NotificationLog.create({
        channel: 'EMAIL',
        recipient: payload.to,
        template: payload.template,
        status: 'SENT',
        metadata: { subject: payload.subject, data: payload.data },
      });

      return true;
    } catch (error: any) {
      console.error('[Notification:EMAIL] Failed to log email notification:', error.message);
      return false;
    }
  }

  /**
   * Send SMS Notification
   */
  public static async sendSms(payload: SmsPayload): Promise<boolean> {
    try {
      if (env.SMS_PROVIDER === 'CONSOLE' || env.NODE_ENV === 'test') {
        console.log(`[Notification:SMS] To: ${payload.to} | Message: ${payload.message}`);
      }

      await NotificationLog.create({
        channel: 'SMS',
        recipient: payload.to,
        template: payload.template,
        status: 'SENT',
        metadata: { message: payload.message },
      });

      return true;
    } catch (error: any) {
      console.error('[Notification:SMS] Failed to log SMS notification:', error.message);
      return false;
    }
  }
}
