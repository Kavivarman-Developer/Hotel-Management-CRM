import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  QrCode,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Car,
  Clock,
  Plus,
  Trash2,
  FileCheck,
  BedDouble,
  Users,
} from 'lucide-react';
import {
  useValidateQrTokenQuery,
  useSubmitRegistrationMutation,
  useSubmitWalkInRegistrationMutation,
} from '../registrationApi';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatDisplayDate } from '@/utils/dates';

interface RegistrationFormData {
  fullName: string;
  phone: string;
  email: string;
  nationality: string;
  idProofType: 'Aadhaar' | 'Passport' | 'Driving License' | 'Voter ID' | 'Other';
  idProofNumber: string;
  vehicleNumber?: string;
  estimatedArrivalTime?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  specialRequests?: string;
  consentGranted: boolean;
  additionalGuests: Array<{
    name: string;
    age: number;
    relation: string;
  }>;
}

export const QrRegistrationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const isWalkIn = !token || token === 'counter-walkin' || token === 'walk-in';

  const {
    data: validateResponse,
    isLoading: isValidating,
    isError: isValidateError,
  } = useValidateQrTokenQuery(token || '', { skip: isWalkIn });

  const [submitRegistration, { isLoading: isSubmitting }] = useSubmitRegistrationMutation();
  const [submitWalkIn, { isLoading: isSubmittingWalkIn }] = useSubmitWalkInRegistrationMutation();

  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [walkInReference, setWalkInReference] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Short-Stay / Walk-in State
  const [stayType, setStayType] = useState<'DAILY' | 'HOURLY'>('DAILY');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [malesCount, setMalesCount] = useState<number>(1);
  const [femalesCount, setFemalesCount] = useState<number>(0);
  const [numberOfRooms, setNumberOfRooms] = useState<number>(1);

  // Hotel policy calculation
  const isShortStay = stayType === 'HOURLY' && durationHours <= 3;
  const isMixedGenderViolation = isShortStay && numberOfRooms === 1 && malesCount >= 1 && femalesCount >= 1;

  const booking = validateResponse?.data;

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      nationality: 'Indian',
      idProofType: 'Aadhaar',
      idProofNumber: '',
      vehicleNumber: '',
      estimatedArrivalTime: '12:00 PM',
      emergencyName: '',
      emergencyPhone: '',
      emergencyRelation: '',
      consentGranted: true,
      additionalGuests: [],
    },
  });

  const selectedIdType = watch('idProofType');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'additionalGuests',
  });

  const validateIdNumber = (val: string) => {
    if (!val || !val.trim()) return 'ID proof number is required';
    const cleanVal = val.replace(/\s+/g, '');
    if (selectedIdType === 'Aadhaar') {
      if (!/^\d{12}$/.test(cleanVal)) {
        return 'Aadhaar must be exactly 12 digits (e.g. 3860 5861 7763 or 386058617763)';
      }
    } else if (selectedIdType === 'Passport') {
      if (!/^[A-Za-z]\d{7}$/.test(cleanVal)) {
        return 'Passport must start with a letter followed by 7 digits (e.g. A1234567)';
      }
    } else if (selectedIdType === 'Driving License') {
      if (cleanVal.length < 8) {
        return 'Driving license number must be at least 8 characters';
      }
    } else if (selectedIdType === 'Voter ID') {
      if (cleanVal.length < 8) {
        return 'Voter ID must be at least 8 characters';
      }
    } else {
      if (cleanVal.length < 4) {
        return 'ID number must be at least 4 characters';
      }
    }
    return true;
  };

  const onSubmit = async (data: RegistrationFormData) => {
    setSubmitError(null);

    if (isMixedGenderViolation) {
      setSubmitError(
        'Policy Restriction: Male and female guests on short-stay (1-3 hours) must book separate rooms per Grand OMR Residency regulations.'
      );
      return;
    }

    const cleanIdNumber = data.idProofNumber.replace(/\s+/g, '').trim();
    const cleanPhone = data.phone.replace(/[\s-]/g, '').replace(/^(\+91)/, '').trim();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanFullName = data.fullName.trim();

    try {
      if (isWalkIn) {
        const payload = {
          primaryGuest: {
            fullName: cleanFullName,
            phone: cleanPhone,
            email: cleanEmail,
            nationality: data.nationality || 'Indian',
            idProofType: data.idProofType,
            idProofNumber: cleanIdNumber,
          },
          stayRequirements: {
            stayType,
            durationHours: stayType === 'HOURLY' ? durationHours : 24,
            numberOfRooms,
            malesCount,
            femalesCount,
          },
          additionalGuests:
            data.additionalGuests && data.additionalGuests.length > 0
              ? data.additionalGuests.map((g) => ({
                  name: g.name.trim(),
                  age: Number(g.age),
                  relation: g.relation.trim(),
                }))
              : undefined,
          vehicleNumber: data.vehicleNumber?.trim() || undefined,
          emergencyContact:
            data.emergencyName && data.emergencyPhone
              ? {
                  name: data.emergencyName.trim(),
                  phone: data.emergencyPhone.replace(/[\s-]/g, '').replace(/^(\+91)/, '').trim(),
                  relationship: data.emergencyRelation?.trim() || 'Family',
                }
              : undefined,
          specialRequests: data.specialRequests?.trim() || undefined,
          consentGranted: Boolean(data.consentGranted),
        };

        const res = await submitWalkIn(payload).unwrap();
        if (res.success) {
          setWalkInReference(res.data.walkInReference);
          setSubmissionSuccess(true);
          reset();
        }
      } else {
        const payload = {
          token: token!,
          primaryGuest: {
            fullName: cleanFullName,
            phone: cleanPhone,
            email: cleanEmail,
            nationality: data.nationality || 'Indian',
            idProofType: data.idProofType,
            idProofNumber: cleanIdNumber,
          },
          additionalGuests:
            data.additionalGuests && data.additionalGuests.length > 0
              ? data.additionalGuests.map((g) => ({
                  name: g.name.trim(),
                  age: Number(g.age),
                  relation: g.relation.trim(),
                }))
              : undefined,
          vehicleNumber: data.vehicleNumber?.trim() || undefined,
          estimatedArrivalTime: data.estimatedArrivalTime || undefined,
          emergencyContact:
            data.emergencyName && data.emergencyPhone
              ? {
                  name: data.emergencyName.trim(),
                  phone: data.emergencyPhone.replace(/[\s-]/g, '').replace(/^(\+91)/, '').trim(),
                  relationship: data.emergencyRelation?.trim() || 'Family',
                }
              : undefined,
          specialRequests: data.specialRequests?.trim() || undefined,
          consentGranted: Boolean(data.consentGranted),
        };

        const res = await submitRegistration(payload).unwrap();
        if (res.success) {
          setSubmissionSuccess(true);
          reset();
        }
      }
    } catch (err: any) {
      const errorMsg =
        err?.data?.error?.message ||
        err?.data?.message ||
        (err?.data?.error?.details && Array.isArray(err.data.error.details)
          ? err.data.error.details.map((d: any) => d.message).join(', ')
          : null) ||
        err?.error ||
        'Registration submission failed. Please try again.';
      setSubmitError(errorMsg);
    }
  };

  if (!isWalkIn && isValidating) {
    return (
      <LoadingSpinner
        size="lg"
        message="Validating express check-in token..."
        fullPage
      />
    );
  }

  if (!isWalkIn && (isValidateError || !booking?.valid)) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="p-8 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-stone-100">
            Invalid or Expired QR Pass
          </h2>
          <p className="text-xs text-stone-400">
            This digital check-in link is either expired, already completed, or unrecognized by the
            property management system.
          </p>
          <div className="pt-2">
            <Link to="/">
              <Button variant="outline" size="sm">
                Return to Grand OMR Residency Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submissionSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-8 md:p-10 rounded-2xl bg-stone-900/90 border border-emerald-600/50 space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block mb-1">
              Digital Registration Submitted
            </span>
            <h2 className="font-serif text-2xl font-bold text-stone-100">
              {walkInReference ? 'Walk-In Registration Logged' : 'Registration Ready for Verification'}
            </h2>
            <p className="mt-2 text-xs text-stone-300 leading-relaxed">
              Your details have been securely logged with the front desk database. Present your original
              government ID to the front desk reception staff for instant key handover.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-xs text-left space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-stone-500">{walkInReference ? 'Walk-In Token Code:' : 'Booking Ref:'}</span>
              <span className="text-gold-400 font-mono font-bold text-sm">
                {walkInReference || booking?.bookingReference}
              </span>
            </div>
            {stayType === 'HOURLY' && (
              <div className="flex justify-between">
                <span className="text-stone-500">Stay Duration:</span>
                <span className="text-amber-400 font-semibold">{durationHours} Hours Short-Stay</span>
              </div>
            )}
            {booking?.roomType && (
              <div className="flex justify-between">
                <span className="text-stone-500">Room Category:</span>
                <span className="text-stone-200">{booking.roomType.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-stone-500">Registration Status:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PENDING VERIFICATION
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="gold"
              size="md"
              className="flex-1"
              onClick={() => {
                reset({
                  fullName: '',
                  phone: '',
                  email: '',
                  nationality: 'Indian',
                  idProofType: 'Aadhaar',
                  idProofNumber: '',
                  vehicleNumber: '',
                  estimatedArrivalTime: '12:00 PM',
                  emergencyName: '',
                  emergencyPhone: '',
                  emergencyRelation: '',
                  consentGranted: true,
                  additionalGuests: [],
                });
                setSubmissionSuccess(false);
                setWalkInReference(null);
                setSubmitError(null);
                setStayType('DAILY');
                setDurationHours(2);
                setMalesCount(1);
                setFemalesCount(0);
                setNumberOfRooms(1);
              }}
            >
              + Register Another Guest
            </Button>
            <Link to="/" className="flex-1">
              <Button variant="outline" size="md" className="w-full">
                Back to Website
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold uppercase tracking-widest mb-3">
          <QrCode className="w-3.5 h-3.5" />
          <span>{isWalkIn ? 'Front Counter Express Check-In' : 'Contactless Guest Registration'}</span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-100">
          {isWalkIn ? 'Express Walk-In Registration' : 'Express Digital Check-In'}
        </h1>
        <p className="text-xs text-stone-400 mt-1 max-w-lg mx-auto">
          {isWalkIn
            ? 'Welcome to GRAND OMR RESIDENCY! Enter your details and government ID to register instantly at our front desk.'
            : 'Complete mandatory government ID verification in advance to skip the reception desk wait.'}
        </p>
      </div>

      {/* Booking Itinerary Preview (For Online Booking) */}
      {!isWalkIn && booking && (
        <div className="mb-8 p-5 rounded-2xl bg-forest-950/60 border border-emerald-800/40 text-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase text-emerald-400 font-bold block">
              Confirmed Reservation
            </span>
            <span className="font-serif text-base font-bold text-stone-100">
              {booking.bookingReference}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-stone-400 block">Room</span>
            <span className="text-stone-200 font-semibold">{booking.roomType.name}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-stone-400 block">Dates</span>
            <span className="text-stone-200 font-semibold">
              {formatDisplayDate(booking.checkInDate)} – {formatDisplayDate(booking.checkOutDate)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-stone-400 block">Guests</span>
            <span className="text-stone-200 font-semibold">{booking.numberOfGuests} Guests</span>
          </div>
        </div>
      )}

      {/* Walk-In Stay Selection & Hotel Policy Banner */}
      {isWalkIn && (
        <div className="mb-8 p-6 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              Select Stay Type
            </span>
            <span className="text-[11px] text-gold-400">GRAND OMR RESIDENCY, Navalur</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setStayType('DAILY');
                setNumberOfRooms(1);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                stayType === 'DAILY'
                  ? 'bg-gold-500/15 border-gold-500 text-stone-100 shadow-md shadow-gold-500/10'
                  : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-gold-400" />
                <span className="font-bold text-xs text-stone-100">Standard Overnight Stay</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">24-hour overnight stay with regular check-in/out</p>
            </button>

            <button
              type="button"
              onClick={() => setStayType('HOURLY')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                stayType === 'HOURLY'
                  ? 'bg-gold-500/15 border-gold-500 text-stone-100 shadow-md shadow-gold-500/10'
                  : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold-400" />
                <span className="font-bold text-xs text-stone-100">Short-Stay / Hourly (1-3 Hrs)</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Transit rest & freshening up (1, 2, or 3 Hours)</p>
            </button>
          </div>

          {/* Hourly options and gender breakdown */}
          {stayType === 'HOURLY' && (
            <div className="pt-3 border-t border-stone-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-stone-400 font-semibold block mb-1">Duration</label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
                  >
                    <option value={1}>1 Hour (Quick Rest)</option>
                    <option value={2}>2 Hours (Standard Short-Stay)</option>
                    <option value={3}>3 Hours (Extended Transit)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-stone-400 font-semibold block mb-1">Male Guests</label>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={malesCount}
                    onChange={(e) => setMalesCount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-stone-400 font-semibold block mb-1">Female Guests</label>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={femalesCount}
                    onChange={(e) => setFemalesCount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
                  />
                </div>
              </div>

              {/* HOTEL POLICY ALERT */}
              {isMixedGenderViolation ? (
                <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/60 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Hotel Policy Alert: Short-Stay Room Allocation Restriction</span>
                  </div>
                  <p className="text-rose-200 text-[11px] leading-relaxed">
                    Per GRAND OMR RESIDENCY regulations, short-stay / hourly bookings (1-3 hours) for
                    male and female guests in a single room are strictly prohibited. Single room short-stay
                    is permitted for individual guests or male business/transit travelers.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setNumberOfRooms(2)}
                      className="px-3 py-1.5 rounded-lg bg-gold-500 text-stone-950 font-bold text-[11px] hover:bg-gold-400"
                    >
                      Book 2 Separate Rooms (1 Male, 1 Female)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStayType('DAILY');
                        setNumberOfRooms(1);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-200 text-[11px] hover:bg-stone-700"
                    >
                      Switch to Standard Overnight Stay
                    </button>
                  </div>
                </div>
              ) : numberOfRooms >= 2 && malesCount >= 1 && femalesCount >= 1 ? (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Separate room allocation active (2 Rooms). Compliant with Grand OMR Residency short-stay policy.
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {submitError && (
        <div className="mb-6">
          <ErrorMessage title="Submission Error" message={submitError} />
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Primary Guest Identity */}
        <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-6 md:p-8 backdrop-blur-md space-y-5">
          <div className="pb-3 border-b border-stone-800 flex items-center gap-2 text-stone-100 font-serif font-bold text-base">
            <User className="w-4 h-4 text-gold-400" />
            <span>Primary Guest Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name (As on Government ID)"
              placeholder="e.g. Ramesh Kannan"
              required
              error={errors.fullName?.message}
              {...register('fullName', {
                required: 'Full name is required as on Government ID',
                minLength: {
                  value: 3,
                  message: 'Name must be at least 3 characters',
                },
                pattern: {
                  value: /^[a-zA-Z\s.'-]+$/,
                  message: 'Name can only contain alphabets and spaces',
                },
              })}
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="10-digit mobile"
              required
              error={errors.phone?.message}
              {...register('phone', {
                required: 'Mobile number is required',
                pattern: {
                  value: /^[6-9]\d{9}$/,
                  message: 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)',
                },
              })}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="ramesh@example.com"
              required
              error={errors.email?.message}
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address (e.g. name@domain.com)',
                },
              })}
            />

            <Input
              label="Nationality"
              placeholder="Indian"
              error={errors.nationality?.message}
              {...register('nationality')}
            />
          </div>

          {/* Government ID proof */}
          <div className="pt-3 border-t border-stone-800 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-300 block">
              Government Photo ID (Required by Law)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="ID Proof Type"
                options={[
                  { label: 'Aadhaar Card', value: 'Aadhaar' },
                  { label: 'Passport', value: 'Passport' },
                  { label: 'Driving License', value: 'Driving License' },
                  { label: 'Voter ID', value: 'Voter ID' },
                  { label: 'Other Government ID', value: 'Other' },
                ]}
                {...register('idProofType')}
              />

              <Input
                label="ID Proof Number"
                placeholder={
                  selectedIdType === 'Aadhaar'
                    ? '12-digit Aadhaar (e.g. 3860 5861 7763)'
                    : selectedIdType === 'Passport'
                    ? 'Passport No. (e.g. A1234567)'
                    : 'Enter ID Proof Number'
                }
                required
                error={errors.idProofNumber?.message}
                helperText={
                  selectedIdType === 'Aadhaar'
                    ? 'Masked as ********7763 in compliance with UIDAI privacy standards.'
                    : 'Encrypted and stored securely for hotel guest compliance.'
                }
                {...register('idProofNumber', {
                  required: 'ID proof number is required',
                  validate: validateIdNumber,
                })}
              />
            </div>
          </div>
        </div>

        {/* Arrival & Vehicle Information */}
        <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-6 backdrop-blur-md space-y-4">
          <div className="pb-3 border-b border-stone-800 flex items-center gap-2 text-stone-100 font-serif font-bold text-base">
            <Car className="w-4 h-4 text-gold-400" />
            <span>Arrival & Vehicle Logistics</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Vehicle Registration Number (Optional)"
              placeholder="e.g. TN 09 BK 1234 (For Valet Pass)"
              leftIcon={<Car className="w-4 h-4" />}
              {...register('vehicleNumber')}
            />

            <Input
              label="Estimated Arrival Time"
              placeholder="e.g. 1:30 PM"
              leftIcon={<Clock className="w-4 h-4" />}
              {...register('estimatedArrivalTime')}
            />
          </div>
        </div>

        {/* Additional Guests */}
        <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <span className="font-serif font-bold text-stone-100 text-base">
              Additional Guests Traveling With You
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => append({ name: '', age: 25, relation: 'Spouse' })}
            >
              Add Guest
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="text-xs text-stone-400">
              No additional guests added. Click "Add Guest" if other people are sharing this room.
            </p>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col sm:flex-row items-end gap-3 p-3 rounded-xl bg-stone-950/70 border border-stone-800"
                >
                  <div className="flex-1 w-full">
                    <Input
                      label={`Guest ${index + 1} Name`}
                      placeholder="Name as on ID"
                      {...register(`additionalGuests.${index}.name` as const, {
                        required: true,
                      })}
                    />
                  </div>
                  <div className="w-full sm:w-24">
                    <Input
                      label="Age"
                      type="number"
                      placeholder="Age"
                      {...register(`additionalGuests.${index}.age` as const, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="w-full sm:w-36">
                    <Input
                      label="Relationship"
                      placeholder="Family / Friend"
                      {...register(`additionalGuests.${index}.relation` as const)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2.5 rounded-lg text-rose-400 hover:bg-rose-950 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Consent and Submit */}
        <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-6 backdrop-blur-md space-y-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="mt-1 rounded bg-stone-950 border-stone-700 text-gold-500 focus:ring-gold-500 w-4 h-4"
              {...register('consentGranted', { required: 'Consent is required' })}
            />
            <span className="text-xs text-stone-300 leading-relaxed">
              I certify that all details provided are true and accurate. I agree to present the
              original government ID upon check-in for physical verification.
            </span>
          </label>
          {errors.consentGranted && (
            <p className="text-xs text-rose-400 font-medium">{errors.consentGranted.message}</p>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full"
              isLoading={isWalkIn ? isSubmittingWalkIn : isSubmitting}
              rightIcon={<FileCheck className="w-4 h-4" />}
            >
              Submit Express Registration
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
