"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const NotificationLog_1 = require("../models/NotificationLog");
const env_1 = require("../config/env");
class NotificationService {
    /**
     * Send Email Notification
     */
    static async sendEmail(payload) {
        try {
            if (env_1.env.EMAIL_PROVIDER === 'CONSOLE' || env_1.env.NODE_ENV === 'test') {
                console.log(`[Notification:EMAIL] To: ${payload.to} | Subject: ${payload.subject}`);
            }
            await NotificationLog_1.NotificationLog.create({
                channel: 'EMAIL',
                recipient: payload.to,
                template: payload.template,
                status: 'SENT',
                metadata: { subject: payload.subject, data: payload.data },
            });
            return true;
        }
        catch (error) {
            console.error('[Notification:EMAIL] Failed to log email notification:', error.message);
            return false;
        }
    }
    /**
     * Send SMS Notification
     */
    static async sendSms(payload) {
        try {
            if (env_1.env.SMS_PROVIDER === 'CONSOLE' || env_1.env.NODE_ENV === 'test') {
                console.log(`[Notification:SMS] To: ${payload.to} | Message: ${payload.message}`);
            }
            await NotificationLog_1.NotificationLog.create({
                channel: 'SMS',
                recipient: payload.to,
                template: payload.template,
                status: 'SENT',
                metadata: { message: payload.message },
            });
            return true;
        }
        catch (error) {
            console.error('[Notification:SMS] Failed to log SMS notification:', error.message);
            return false;
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map