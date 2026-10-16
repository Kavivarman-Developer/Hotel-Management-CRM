import { describe, it, expect } from 'vitest';
import { AvailableRoomOption, AvailabilitySearchResponse } from '@/types';

describe('Availability Data Parsing & Mapping', () => {
  it('safely extracts roomTypes array from backend envelope object', () => {
    const backendPayload: AvailabilitySearchResponse = {
      searchCriteria: {
        checkIn: '2026-10-15',
        checkOut: '2026-10-16',
        guests: 2,
        rooms: 1,
      },
      available: true,
      totalAvailableRooms: 6,
      roomTypes: [
        {
          roomType: {
            _id: 'rt_1',
            id: 'rt_1',
            name: 'Deluxe King',
            code: 'deluxe-king',
            category: 'deluxe',
            description: 'Luxury deluxe room',
            bedConfiguration: 'King Bed',
            amenities: ['Wi-Fi'],
            images: [],
            defaultNightlyRate: 179900,
          },
          availableRoomsCount: 6,
          pricing: {
            currency: 'INR',
            nightCount: 1,
            perNightBreakdown: [],
            subtotal: 179900,
            discount: 0,
            taxes: 21588,
            taxRatePercentage: 12,
            additionalCharges: 0,
            totalAmount: 201488,
          },
        },
      ],
    };

    const rawData: any = backendPayload;
    const extractedOptions: AvailableRoomOption[] = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.roomTypes)
      ? rawData.roomTypes
      : [];

    expect(Array.isArray(extractedOptions)).toBe(true);
    expect(extractedOptions.length).toBe(1);
    expect(extractedOptions[0].roomType.name).toBe('Deluxe King');
  });

  it('safely extracts array if payload is already an array', () => {
    const rawData: any = [{ roomType: { name: 'Suite' } }];
    const extractedOptions = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.roomTypes)
      ? rawData.roomTypes
      : [];

    expect(Array.isArray(extractedOptions)).toBe(true);
    expect(extractedOptions.length).toBe(1);
  });
});
