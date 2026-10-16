"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const RoomType_1 = require("../models/RoomType");
const Room_1 = require("../models/Room");
const RatePlan_1 = require("../models/RatePlan");
const PartnerHotel_1 = require("../models/PartnerHotel");
const PropertySettings_1 = require("../models/PropertySettings");
const auth_service_1 = require("../services/auth.service");
const types_1 = require("../types");
const seedDatabase = async () => {
    console.log('[Seed] Starting database seed process...');
    await (0, database_1.connectDatabase)();
    try {
        // 1. Property Settings
        let settings = await PropertySettings_1.PropertySettings.findOne();
        if (!settings) {
            settings = await PropertySettings_1.PropertySettings.create({
                propertyName: 'GRAND OMR RESIDENCY',
                tagline: 'Luxury Stay & Mobile Booking in Navalur, Chennai',
                address: '5, Rajiv Gandhi Salai, Sholinganallur, Navalur',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600130',
                country: 'India',
                phone: '+91 8110018708',
                email: 'reservations@grandomrresidency.com',
                checkInTime: '14:00',
                checkOutTime: '11:00',
                timezone: 'Asia/Kolkata',
                holdDurationMinutes: 15,
                defaultGstPercentage: 12,
                cancellationGraceHours: 24,
            });
            console.log('[Seed] Created property settings for Grand OMR Residency');
        }
        // 2. Default Administrative Users
        const defaultUsers = [
            {
                name: 'Super Administrator',
                email: 'admin@grandomrresidency.com',
                mobile: '+91 8110018708',
                password: 'SuperAdmin@2026',
                role: types_1.UserRole.SUPER_ADMIN,
                permissions: [...types_1.ALL_PERMISSIONS],
            },
            {
                name: 'Operations Manager',
                email: 'manager@grandomrresidency.com',
                mobile: '+91 9840123456',
                password: 'Manager@2026',
                role: types_1.UserRole.MANAGER,
                permissions: types_1.DEFAULT_ROLE_PERMISSIONS[types_1.UserRole.MANAGER],
            },
            {
                name: 'Front Desk Officer',
                email: 'frontdesk@grandomrresidency.com',
                mobile: '+91 9840987654',
                password: 'FrontDesk@2026',
                role: types_1.UserRole.FRONT_DESK,
                permissions: types_1.DEFAULT_ROLE_PERMISSIONS[types_1.UserRole.FRONT_DESK],
            },
        ];
        for (const u of defaultUsers) {
            const exists = await User_1.User.findOne({ email: u.email });
            if (!exists) {
                const passwordHash = await auth_service_1.AuthService.hashPassword(u.password);
                await User_1.User.create({
                    name: u.name,
                    email: u.email,
                    mobile: u.mobile,
                    passwordHash,
                    role: u.role,
                    permissions: u.permissions,
                    isActive: true,
                });
                console.log(`[Seed] Created ${u.role} user: ${u.email}`);
            }
        }
        // 3. Room Types (Authentic categories from Grand OMR Residency)
        const roomTypeConfigs = [
            {
                code: 'deluxe-king',
                name: 'Deluxe King Room with Mood Lighting',
                tagline: 'Signature ambient purple cove ceiling with luxury wood paneling',
                category: 'deluxe',
                description: 'Spacious deluxe room featuring ambient LED purple cove lighting, king-size orthopedic mattress, attached modern marble-finish bathroom, wall-mounted HD Smart TV, teak wood wardrobe & vanity dresser, high-speed fiber Wi-Fi, and split AC.',
                maxOccupancy: { adults: 2, children: 1, total: 3 },
                bedConfiguration: 'King Size Ultra-Comfort Bed',
                sizeSqFt: 280,
                baseRate: 220000, // ₹2,200 in paise
                defaultNightlyRate: 179900, // ₹1,799 in paise
                features: [
                    'Ambient LED purple cove lighting',
                    'King-size orthopedic mattress',
                    'Attached modern marble-finish bathroom',
                    'Wall-mounted HD Smart TV',
                    'Teak wood wardrobe & vanity dresser',
                    'High-speed Wi-Fi & work desk',
                ],
                amenities: ['Air Conditioning', 'Free Wi-Fi', 'Room Service', 'Hot Water 24/7', 'Electric Kettle', 'Clean Linen'],
                images: [
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
                ],
                roomNumbers: ['101', '102', '103', '104', '105', '106'],
                floor: 1,
            },
            {
                code: 'executive-suite',
                name: 'Executive Business Suite',
                tagline: 'Tailored for IT professionals & corporate travelers along OMR',
                category: 'suite',
                description: 'Tailored for corporate travelers and IT professionals along OMR Navalur. Includes a dedicated ergonomic workstation, dual ambient lighting modes, rainfall shower, mini-refrigerator, and daily express housekeeping.',
                maxOccupancy: { adults: 2, children: 2, total: 4 },
                bedConfiguration: 'California King Bed + Sofa Lounge',
                sizeSqFt: 360,
                baseRate: 290000, // ₹2,900 in paise
                defaultNightlyRate: 239900, // ₹2,399 in paise
                features: [
                    'Dedicated ergonomic workstation',
                    'Dual ambient lighting modes (Relax & Work)',
                    'Spacious bathroom with rainfall shower',
                    'Mini bar & tea/coffee station',
                    'Full-length mirror & double wooden wardrobe',
                    'Express laundry & daily housekeeping',
                ],
                amenities: [
                    'Air Conditioning',
                    'High-Speed Fiber Wi-Fi',
                    'Smart TV with OTT',
                    'Hot Water',
                    'Complimentary Breakfast',
                    'Iron on Request',
                ],
                images: [
                    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
                ],
                roomNumbers: ['201', '202', '203', '204'],
                floor: 2,
            },
            {
                code: 'garden-cottage',
                name: 'Grand Garden Cottage Villa',
                tagline: 'Direct resort lawn access with rustic brick verandah lounge',
                category: 'cottage',
                description: 'Ground-floor villa cottage featuring direct resort lawn access, rustic red-brick verandah lounge, outdoor seating, two queen beds, custom silent split ACs, and peaceful greenery.',
                maxOccupancy: { adults: 4, children: 2, total: 6 },
                bedConfiguration: 'Two Queen Beds / Family Setup',
                sizeSqFt: 450,
                baseRate: 380000, // ₹3,800 in paise
                defaultNightlyRate: 299900, // ₹2,999 in paise
                features: [
                    'Ground-floor cottage with private verandah',
                    'Direct view of lush coconut palms & green lawn',
                    'Outdoor seating with rustic red bench lounge',
                    'Extra spacious family layout',
                    'Custom ceiling fans & silent split ACs',
                    'Complimentary evening tea/coffee in garden',
                ],
                amenities: [
                    'Lawn Access',
                    'Air Conditioning',
                    'High-Speed Wi-Fi',
                    '24/7 Hot Water',
                    'Verandah Lounge',
                    'Free Dedicated Parking',
                ],
                images: [
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
                ],
                roomNumbers: ['301', '302', '303'],
                floor: 1,
            },
        ];
        for (const config of roomTypeConfigs) {
            let roomType = await RoomType_1.RoomType.findOne({ code: config.code });
            if (!roomType) {
                roomType = await RoomType_1.RoomType.create({
                    name: config.name,
                    code: config.code,
                    description: config.description,
                    tagline: config.tagline,
                    category: config.category,
                    maxOccupancy: config.maxOccupancy,
                    bedConfiguration: config.bedConfiguration,
                    amenities: config.amenities,
                    features: config.features,
                    images: config.images,
                    baseRate: config.baseRate,
                    defaultNightlyRate: config.defaultNightlyRate,
                    sizeSqFt: config.sizeSqFt,
                    isActive: true,
                });
                console.log(`[Seed] Created RoomType: ${roomType.name} (${roomType.code})`);
            }
            // 4. RatePlan for RoomType
            let ratePlan = await RatePlan_1.RatePlan.findOne({ roomTypeId: roomType._id });
            if (!ratePlan) {
                ratePlan = await RatePlan_1.RatePlan.create({
                    roomTypeId: roomType._id,
                    currency: 'INR',
                    defaultRate: config.defaultNightlyRate,
                    weekdayWeekendRules: {
                        weekendMultiplier: 1.15, // +15% on Friday & Saturday nights
                        applyOnDays: [5, 6],
                    },
                    seasonalRules: [
                        {
                            name: 'OMR Tech Summit Season',
                            startDate: '2026-11-01',
                            endDate: '2026-11-15',
                            multiplier: 1.25,
                        },
                    ],
                    dateSpecificRates: [
                        {
                            date: '2026-12-31',
                            rate: config.defaultNightlyRate + 100000, // +₹1,000 New Year's Eve
                            reason: "New Year's Eve",
                        },
                    ],
                    extraGuestCharges: 50000, // ₹500 in paise
                    discountConfiguration: [
                        {
                            code: 'WELCOME10',
                            percentage: 10,
                            maxDiscountAmount: 50000, // max ₹500 discount
                            validFrom: '2026-01-01',
                            validTo: '2026-12-31',
                            active: true,
                        },
                    ],
                    taxConfiguration: {
                        gstPercentage: 12,
                        name: 'GST',
                    },
                    isActive: true,
                });
                console.log(`[Seed] Created RatePlan for: ${roomType.name}`);
            }
            // 5. Physical Rooms
            for (const roomNum of config.roomNumbers) {
                const roomExists = await Room_1.Room.findOne({ roomNumber: roomNum });
                if (!roomExists) {
                    await Room_1.Room.create({
                        roomNumber: roomNum,
                        roomTypeId: roomType._id,
                        floor: config.floor,
                        maxGuests: config.maxOccupancy.total,
                        amenities: config.amenities,
                        status: types_1.RoomStatus.ACTIVE,
                        housekeepingStatus: types_1.HousekeepingStatus.CLEAN,
                    });
                    console.log(`[Seed] Created physical Room #${roomNum}`);
                }
            }
        }
        // 6. Partner Hotels
        const partnerListings = [
            {
                hotelName: 'Grand OMR Residency - Beach Villa Partner',
                description: 'Luxury beachfront extension partner along East Coast Road (ECR), Chennai.',
                address: '14, East Coast Road, Kovalam',
                city: 'Chennai',
                contactInformation: {
                    phone: '+91 8110018708',
                    email: 'ecr.partner@grandomrresidency.com',
                },
                images: ['https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80'],
                amenities: ['Private Beach Access', 'Infinity Pool', 'Seafood Restaurant'],
                officialWebsiteUrl: 'https://grandomrresidency.ai.studio',
                externalBookingUrl: 'https://grandomrresidency.ai.studio',
            },
        ];
        for (const p of partnerListings) {
            const exists = await PartnerHotel_1.PartnerHotel.findOne({ hotelName: p.hotelName });
            if (!exists) {
                await PartnerHotel_1.PartnerHotel.create(p);
                console.log(`[Seed] Created Partner Hotel: ${p.hotelName}`);
            }
        }
        console.log('[Seed] Database seeding completed successfully.');
    }
    catch (error) {
        console.error('[Seed] Seeding failed:', error.message);
        throw error;
    }
    finally {
        await (0, database_1.disconnectDatabase)();
    }
};
exports.seedDatabase = seedDatabase;
// Execute if run directly
if (require.main === module) {
    (0, exports.seedDatabase)()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
//# sourceMappingURL=seed.js.map