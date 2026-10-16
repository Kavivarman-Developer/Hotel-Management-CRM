import { IUser } from '../models/User';
import { Permission } from '../types';
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}
export declare class AuthService {
    /**
     * Hashes password using bcrypt with salt rounds 10
     */
    static hashPassword(password: string): Promise<string>;
    /**
     * Compares plaintext password with bcrypt hash
     */
    static comparePassword(password: string, hash: string): Promise<boolean>;
    /**
     * Hashes refresh token before saving in database
     */
    private static hashRefreshToken;
    /**
     * Generates Access Token (short-lived) and Refresh Token (longer-lived)
     */
    static generateTokens(user: IUser): TokenPair;
    /**
     * Authenticate user, check account activation, generate token pair and rotate refresh token
     */
    static login(email: string, pass: string, ipAddress?: string): Promise<{
        user: Partial<IUser>;
        tokens: TokenPair;
    }>;
    /**
     * Rotate refresh token and issue new token pair
     */
    static refreshAccessToken(refreshToken: string): Promise<{
        tokens: TokenPair;
    }>;
    /**
     * Logout user by revoking the stored refresh token
     */
    static logout(userId: string): Promise<void>;
    /**
     * Update permissions (SUPER_ADMIN only rule)
     */
    static updatePermissions(actingUserId: string, targetUserId: string, newPermissions: Permission[]): Promise<IUser>;
}
