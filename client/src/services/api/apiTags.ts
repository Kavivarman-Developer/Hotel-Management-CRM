export const API_TAGS = {
  ROOMS: 'Rooms',
  ROOM_TYPES: 'RoomTypes',
  AVAILABILITY: 'Availability',
  BOOKINGS: 'Bookings',
  STAYS: 'Stays',
  ARRIVALS: 'Arrivals',
  REGISTRATIONS: 'Registrations',
  STAFF: 'Staff',
  PARTNERS: 'Partners',
  DASHBOARD: 'Dashboard',
  REPORTS: 'Reports',
  PAYMENTS: 'Payments',
  AUTH: 'Auth',
  VOUCHERS: 'Vouchers',
  EXTRA_STAYS: 'ExtraStays',
  SETTINGS: 'Settings',
  PERMISSIONS: 'Permissions',
} as const;

export type ApiTag = (typeof API_TAGS)[keyof typeof API_TAGS];

export const ALL_TAG_TYPES = Object.values(API_TAGS);
