import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, CreditCard, Hotel, AlertCircle, ArrowRight } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { setHoldData, clearHold } from '../checkoutSlice';
import { useCreateHoldMutation, useCreateBookingMutation } from '../bookingsApi';
import { HoldCountdownTimer } from './HoldCountdownTimer';
import { Button } from '@/components/common/Button';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatCurrency } from '@/utils/formatters';

interface ReviewHoldStepProps {
  onConfirmed: (bookingData: any) => void;
  onBack: () => void;
}

export const ReviewHoldStep: React.FC<ReviewHoldStepProps> = ({ onConfirmed, onBack }) => {
  const dispatch = useAppDispatch();
  const {
    selectedRoomType,
    guestDetails,
    specialRequests,
    holdId,
    holdToken,
    holdExpiresAt,
    pricing,
  } = useAppSelector((state) => state.checkout);

  const { checkInDate, checkOutDate, numberOfGuests, numberOfRooms, discountCode } =
    useAppSelector((state) => state.bookingSearch);

  const [paymentOption, setPaymentOption] = useState<'PAY_AT_HOTEL' | 'PAY_ONLINE'>(
    'PAY_AT_HOTEL'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [createHold, { isLoading: isHoldLoading }] = useCreateHoldMutation();
  const [createBooking, { isLoading: isBookingLoading }] = useCreateBookingMutation();

  // Acquire room hold when entering step if not already held
  useEffect(() => {
    if (!holdId && selectedRoomType) {
      createHold({
        roomTypeId: selectedRoomType._id,
        checkInDate,
        checkOutDate,
        numberOfGuests,
        discountCode: discountCode || undefined,
      })
        .unwrap()
        .then((res) => {
          if (res.success && res.data) {
            dispatch(
              setHoldData({
                holdId: res.data.holdId,
                holdToken: res.data.holdToken,
                expiresAt: res.data.expiresAt,
                pricing: res.data.pricing,
              })
            );
          }
        })
        .catch((err) => {
          setErrorMsg(
            err?.data?.error?.message ||
              'Could not secure inventory lock. The room may have been taken by another guest.'
          );
        });
    }
  }, [holdId, selectedRoomType, checkInDate, checkOutDate, numberOfGuests, discountCode, createHold, dispatch]);

  const handleConfirmReservation = async () => {
    if (!selectedRoomType || !guestDetails) return;
    setErrorMsg(null);

    try {
      const payload = {
        holdId: holdId || undefined,
        holdToken: holdToken || undefined,
        roomTypeId: selectedRoomType._id,
        checkInDate,
        checkOutDate,
        numberOfGuests,
        numberOfRooms,
        discountCode: discountCode || undefined,
        guest: {
          fullName: guestDetails.fullName,
          email: guestDetails.email,
          mobile: guestDetails.mobile,
          nationality: guestDetails.nationality || 'Indian',
        },
        source: 'WEBSITE',
        specialRequests: specialRequests || undefined,
      };

      const res = await createBooking(payload).unwrap();
      if (res.success && res.data) {
        onConfirmed(res.data);
      }
    } catch (err: any) {
      setErrorMsg(
        err?.data?.error?.message ||
          'Booking creation failed. Please verify your details or try again.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Hold Timer Banner */}
      {holdExpiresAt && (
        <HoldCountdownTimer
          expiresAt={holdExpiresAt}
          onExpire={() => {
            dispatch(clearHold());
            setErrorMsg('Your room hold has expired. Please select your room again.');
          }}
        />
      )}

      {errorMsg && (
        <ErrorMessage
          title="Booking Hold Notice"
          message={errorMsg}
          onRetry={() => {
            setErrorMsg(null);
            dispatch(clearHold());
          }}
        />
      )}

      {/* Guest Summary Card */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <h3 className="font-serif text-lg font-bold text-stone-100">Guest Information</h3>
          <button
            onClick={onBack}
            className="text-xs text-gold-400 hover:text-gold-300 font-semibold"
          >
            Edit Info
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-stone-400 block mb-0.5">Guest Name</span>
            <span className="text-stone-100 font-semibold">{guestDetails?.fullName}</span>
          </div>
          <div>
            <span className="text-stone-400 block mb-0.5">Email</span>
            <span className="text-stone-100 font-semibold">{guestDetails?.email}</span>
          </div>
          <div>
            <span className="text-stone-400 block mb-0.5">Mobile</span>
            <span className="text-stone-100 font-semibold">+91 {guestDetails?.mobile}</span>
          </div>
          {specialRequests && (
            <div className="col-span-2 md:col-span-3 pt-2 border-t border-stone-800/80">
              <span className="text-stone-400 block mb-0.5">Special Requests</span>
              <span className="text-stone-300 italic">{specialRequests}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Options */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 backdrop-blur-md space-y-4">
        <div className="pb-3 border-b border-stone-800">
          <h3 className="font-serif text-lg font-bold text-stone-100">Select Payment Method</h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Book now with instant confirmation. Zero cancellation fees apply up to 24 hours prior.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label
            onClick={() => setPaymentOption('PAY_AT_HOTEL')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
              paymentOption === 'PAY_AT_HOTEL'
                ? 'bg-gold-500/10 border-gold-500 text-stone-100 shadow-md shadow-gold-500/10'
                : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700'
            }`}
          >
            <input
              type="radio"
              name="paymentOption"
              checked={paymentOption === 'PAY_AT_HOTEL'}
              onChange={() => setPaymentOption('PAY_AT_HOTEL')}
              className="mt-1 text-gold-500 focus:ring-gold-500"
            />
            <div>
              <div className="flex items-center gap-2 font-bold text-xs">
                <Hotel className="w-4 h-4 text-gold-400" />
                <span>Pay at Hotel Desk (Arrival)</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                Pay by Cash, UPI or Credit/Debit card upon physical check-in. Instant confirmation
                voucher issued right now.
              </p>
            </div>
          </label>

          <label
            onClick={() => setPaymentOption('PAY_ONLINE')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
              paymentOption === 'PAY_ONLINE'
                ? 'bg-gold-500/10 border-gold-500 text-stone-100 shadow-md shadow-gold-500/10'
                : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700'
            }`}
          >
            <input
              type="radio"
              name="paymentOption"
              checked={paymentOption === 'PAY_ONLINE'}
              onChange={() => setPaymentOption('PAY_ONLINE')}
              className="mt-1 text-gold-500 focus:ring-gold-500"
            />
            <div>
              <div className="flex items-center gap-2 font-bold text-xs">
                <CreditCard className="w-4 h-4 text-gold-400" />
                <span>Instant Online Payment (UPI / NetBanking)</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                Pre-pay securely to enjoy priority express check-in and contactless keycard handover.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="md" onClick={onBack}>
          Back
        </Button>
        <Button
          variant="gold"
          size="lg"
          isLoading={isBookingLoading || isHoldLoading}
          onClick={handleConfirmReservation}
          rightIcon={<CheckCircle2 className="w-4 h-4" />}
          className="shadow-lg shadow-gold-500/25"
        >
          Confirm Reservation ({formatCurrency(pricing?.totalAmount || selectedRoomType?.defaultNightlyRate || 179900)})
        </Button>
      </div>
    </div>
  );
};
