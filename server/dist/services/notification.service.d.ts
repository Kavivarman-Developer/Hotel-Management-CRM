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
export declare class NotificationService {
    /**
     * Send Email Notification
     */
    static sendEmail(payload: EmailPayload): Promise<boolean>;
    /**
     * Send SMS Notification
     */
    static sendSms(payload: SmsPayload): Promise<boolean>;
}
