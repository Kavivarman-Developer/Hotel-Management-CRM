import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, Globe, MessageSquare, ArrowRight } from 'lucide-react';
import { guestDetailsSchema, GuestDetailsFormData } from '../bookingValidation';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

interface GuestFormStepProps {
  initialValues?: Partial<GuestDetailsFormData>;
  onSubmit: (data: GuestDetailsFormData) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const GuestFormStep: React.FC<GuestFormStepProps> = ({
  initialValues,
  onSubmit,
  onBack,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestDetailsFormData>({
    resolver: zodResolver(guestDetailsSchema),
    defaultValues: {
      fullName: initialValues?.fullName || '',
      email: initialValues?.email || '',
      mobile: initialValues?.mobile || '',
      nationality: initialValues?.nationality || 'Indian',
      specialRequests: initialValues?.specialRequests || '',
      agreeTerms: true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 md:p-8 backdrop-blur-md space-y-6">
        <div className="border-b border-stone-800 pb-4">
          <h3 className="font-serif text-xl font-bold text-stone-100">Primary Guest Details</h3>
          <p className="text-xs text-stone-400 mt-1">
            Please provide accurate guest details. Booking confirmation and digital check-in passes
            will be dispatched to this email and phone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="md:col-span-2">
            <Input
              label="Full Name"
              placeholder="e.g. Ramesh Kannan"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.fullName?.message}
              required
              {...register('fullName')}
            />
          </div>

          {/* Email */}
          <div>
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. ramesh@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              required
              {...register('email')}
            />
          </div>

          {/* Mobile Number */}
          <div>
            <Input
              label="Mobile Number (WhatsApp Enabled)"
              type="tel"
              placeholder="10-digit mobile number"
              leftIcon={<Phone className="w-4 h-4" />}
              error={errors.mobile?.message}
              required
              {...register('mobile')}
            />
          </div>

          {/* Nationality */}
          <div>
            <Input
              label="Nationality"
              placeholder="Indian"
              leftIcon={<Globe className="w-4 h-4" />}
              error={errors.nationality?.message}
              {...register('nationality')}
            />
          </div>

          {/* Special Requests */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold tracking-wider uppercase text-stone-300 mb-1.5">
              Special Requests (Optional)
            </label>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="e.g. Quiet room away from elevator, extra pillows, early check-in preference"
                className="w-full bg-stone-900/90 text-stone-100 placeholder-stone-500 text-sm rounded-lg border border-stone-800 hover:border-stone-700 focus:border-gold-500/80 focus:ring-2 focus:ring-gold-500/40 p-3 outline-none transition-all resize-none"
                {...register('specialRequests')}
              />
            </div>
            {errors.specialRequests && (
              <p className="mt-1 text-xs text-rose-400 font-medium">
                {errors.specialRequests.message}
              </p>
            )}
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="pt-4 border-t border-stone-800">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="mt-1 rounded bg-stone-950 border-stone-700 text-gold-500 focus:ring-gold-500 w-4 h-4"
              {...register('agreeTerms')}
            />
            <span className="text-xs text-stone-300 leading-relaxed">
              I acknowledge the hotel policies (Check-in 12:00 PM, Check-out 11:00 AM, Government ID
              required upon arrival) and consent to direct reservation communication.
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="mt-1.5 text-xs text-rose-400 font-medium">{errors.agreeTerms.message}</p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="md" onClick={onBack} type="button">
          Back
        </Button>
        <Button
          variant="gold"
          size="lg"
          type="submit"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Proceed to Review & Hold
        </Button>
      </div>
    </form>
  );
};
