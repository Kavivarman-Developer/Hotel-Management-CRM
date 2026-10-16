/**
 * Date manipulation and validation utilities for hotel bookings.
 * Standard format: YYYY-MM-DD
 */

export const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(dateStr);
};

export const getDefaultCheckIn = (): string => {
  return formatDateToISO(new Date());
};

export const getDefaultCheckOut = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateToISO(tomorrow);
};

export const addDays = (dateStr: string, days: number): string => {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateToISO(d);
};

export const getMinCheckOutDate = (checkInDateStr: string): string => {
  if (!checkInDateStr) return getDefaultCheckOut();
  return addDays(checkInDateStr, 1);
};

export const calculateNights = (checkInStr: string, checkOutStr: string): number => {
  if (!checkInStr || !checkOutStr) return 1;
  const checkIn = parseLocalDate(checkInStr);
  const checkOut = parseLocalDate(checkOutStr);
  const diffTime = checkOut.getTime() - checkIn.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatTime = (isoString?: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};
