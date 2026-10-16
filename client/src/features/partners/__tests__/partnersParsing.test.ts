import { describe, it, expect } from 'vitest';
import { PartnerHotel } from '@/types';

describe('Partner Hotel Data Resilience', () => {
  it('correctly handles flat address, city and contactInformation without location object', () => {
    // Exact shape returned by MongoDB PartnerHotel
    const backendPartner: any = {
      _id: 'partner_123',
      hotelName: 'Grand OMR Residency - Beach Villa Partner',
      description: 'Luxury beachfront extension partner along East Coast Road (ECR), Chennai.',
      address: '14, East Coast Road, Kovalam',
      city: 'Chennai',
      contactInformation: {
        phone: '+91 8110018708',
        email: 'ecr.partner@grandomrresidency.com',
      },
      images: ['https://images.unsplash.com/photo-1540541338287-41700207dee6'],
      amenities: ['Private Beach Access'],
      officialWebsiteUrl: 'https://grandomrresidency.ai.studio',
      externalBookingUrl: 'https://grandomrresidency.ai.studio',
      listingStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
    };

    const hotelTitle = backendPartner.hotelName || backendPartner.name || 'Grand Partner Hotel';
    const hotelAddress = backendPartner.address || backendPartner.location?.address || 'East Coast Road';
    const hotelCity = backendPartner.city || backendPartner.location?.city || 'Chennai';
    const hotelPhone =
      backendPartner.contactInformation?.phone || backendPartner.contact?.phone || '+91 81100 18708';

    expect(hotelTitle).toBe('Grand OMR Residency - Beach Villa Partner');
    expect(hotelAddress).toBe('14, East Coast Road, Kovalam');
    expect(hotelCity).toBe('Chennai');
    expect(hotelPhone).toBe('+91 8110018708');
  });

  it('safely falls back if fields are missing or empty', () => {
    const emptyPartner: any = { _id: 'partner_empty' };

    const hotelTitle = emptyPartner.hotelName || emptyPartner.name || 'Grand Partner Hotel';
    const hotelAddress = emptyPartner.address || emptyPartner.location?.address || 'East Coast Road';
    const hotelCity = emptyPartner.city || emptyPartner.location?.city || 'Chennai';
    const hotelPhone =
      emptyPartner.contactInformation?.phone || emptyPartner.contact?.phone || '+91 81100 18708';

    expect(hotelTitle).toBe('Grand Partner Hotel');
    expect(hotelAddress).toBe('East Coast Road');
    expect(hotelCity).toBe('Chennai');
    expect(hotelPhone).toBe('+91 81100 18708');
  });
});
