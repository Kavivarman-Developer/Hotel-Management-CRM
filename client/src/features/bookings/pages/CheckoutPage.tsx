import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, ShieldCheck, ArrowLeft, BedDouble, User, CreditCard } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import {
  setStep,
  setGuestDetails,
  setConfirmedBooking,
  resetCheckout,
} from '../checkoutSlice';
import { PricingSummaryCard } from '../components/PricingSummaryCard';
import { GuestFormStep } from '../components/GuestFormStep';
import { ReviewHoldStep } from '../components/ReviewHoldStep';
import { BookingConfirmationStep } from '../components/BookingConfirmationStep';
import { GuestDetailsFormData } from '../bookingValidation';
import { Button } from '@/components/common/Button';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    currentStep,
    selectedRoomType,
    guestDetails,
    specialRequests,
    pricing,
    confirmedBooking,
  } = useAppSelector((state) => state.checkout);

  const { checkInDate, checkOutDate, numberOfGuests, numberOfRooms } = useAppSelector(
    (state) => state.bookingSearch
  );

  const steps = [
    { number: 1, label: 'Room', icon: BedDouble },
    { number: 2, label: 'Guest Details', icon: User },
    { number: 3, label: 'Review & Hold', icon: CreditCard },
    { number: 4, label: 'Confirmed', icon: Check },
  ];

  if (!selectedRoomType && currentStep !== 4) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="p-8 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-4">
          <BedDouble className="w-12 h-12 text-gold-400 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-stone-100">
            No Room Selected for Checkout
          </h2>
          <p className="text-sm text-stone-400">
            Please search for your desired stay dates and select an available room to proceed.
          </p>
          <div className="pt-2">
            <Link to="/availability">
              <Button variant="gold" size="md">
                Search Available Rooms
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleGuestFormSubmit = (data: GuestDetailsFormData) => {
    dispatch(
      setGuestDetails({
        guest: {
          fullName: data.fullName,
          email: data.email,
          mobile: data.mobile,
          nationality: data.nationality,
        },
        specialRequests: data.specialRequests,
      })
    );
  };

  const handleBookingConfirmed = (data: any) => {
    dispatch(setConfirmedBooking(data));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Wizard Header Stepper */}
      {currentStep !== 4 && (
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            {steps.map((step, idx) => {
              const isPassed = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              const Icon = step.icon;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-stone-100 shadow-md shadow-emerald-900/40'
                          : isCurrent
                          ? 'bg-gradient-to-r from-gold-600 to-gold-400 text-stone-950 ring-4 ring-gold-500/20 shadow-lg shadow-gold-500/30'
                          : 'bg-stone-900 text-stone-500 border border-stone-800'
                      }`}
                    >
                      {isPassed ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span
                      className={`text-[11px] font-medium tracking-wider uppercase ${
                        isCurrent
                          ? 'text-gold-400 font-bold'
                          : isPassed
                          ? 'text-emerald-400'
                          : 'text-stone-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 -mt-5 transition-colors ${
                        currentStep > step.number ? 'bg-emerald-600' : 'bg-stone-800'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Form on Left, Sticky Summary on Right */}
      {currentStep === 4 && confirmedBooking ? (
        <BookingConfirmationStep
          booking={confirmedBooking}
          onReset={() => dispatch(resetCheckout())}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Wizard Form Steps */}
          <div className="lg:col-span-7">
            {currentStep === 2 && (
              <GuestFormStep
                initialValues={
                  guestDetails
                    ? {
                        fullName: guestDetails.fullName,
                        email: guestDetails.email,
                        mobile: guestDetails.mobile,
                        nationality: guestDetails.nationality,
                        specialRequests,
                      }
                    : undefined
                }
                onSubmit={handleGuestFormSubmit}
                onBack={() => navigate('/availability')}
              />
            )}

            {currentStep === 3 && (
              <ReviewHoldStep
                onConfirmed={handleBookingConfirmed}
                onBack={() => dispatch(setStep(2))}
              />
            )}
          </div>

          {/* Sticky Price Breakdown Summary */}
          {selectedRoomType && (
            <div className="lg:col-span-5 sticky top-28">
              <PricingSummaryCard
                roomType={selectedRoomType}
                checkInDate={checkInDate}
                checkOutDate={checkOutDate}
                numberOfGuests={numberOfGuests}
                numberOfRooms={numberOfRooms}
                pricing={pricing}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
