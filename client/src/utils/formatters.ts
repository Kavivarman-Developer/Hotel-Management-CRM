/**
 * Currency and data formatting utilities for GRAND OMR RESIDENCY
 * Note: All backend financial values are stored in integer paise (₹1 = 100 paise).
 */

export const paiseToRupees = (paise: number): number => {
  if (typeof paise !== 'number' || isNaN(paise)) return 0;
  return paise / 100;
};

export const rupeesToPaise = (rupees: number): number => {
  if (typeof rupees !== 'number' || isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
};

export const formatCurrency = (
  paise: number,
  currency: string = 'INR',
  showDecimal: boolean = false
): string => {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: showDecimal ? 2 : 0,
    minimumFractionDigits: showDecimal ? 2 : 0,
  }).format(rupees);
};

export const maskMobile = (mobile: string): string => {
  if (!mobile || mobile.length < 4) return mobile || '';
  const clean = mobile.trim();
  const visible = clean.slice(-4);
  return `••••••${visible}`;
};

export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
};

export const maskIdNumber = (id: string): string => {
  if (!id || id.length <= 4) return '••••';
  const clean = id.trim();
  return `•••• •••• ${clean.slice(-4)}`;
};
