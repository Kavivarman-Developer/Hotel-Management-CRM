import React from 'react';
import { Building2, MapPin, Phone, Mail, Sparkles } from 'lucide-react';
import { useGetPublicPartnersQuery } from '../partnersApi';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/common/Button';

export const PartnersPage: React.FC = () => {
  const { data: response, isLoading, isError, refetch } = useGetPublicPartnersQuery();
  const partners = response?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeader
        eyebrow="Boutique Hospitality Network"
        title="Partner Hotels & Extended Residencies"
        subtitle="Enjoy guaranteed hospitality standards across our affiliated boutique properties and partner network in South India."
      />

      {isLoading ? (
        <LoadingSpinner size="lg" message="Loading partner hotels..." fullPage />
      ) : isError ? (
        <ErrorMessage
          title="Could not load partners"
          message="Failed to retrieve partner hotel network. Please try again."
          onRetry={refetch}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(partners.length > 0 ? partners : [
            {
              _id: 'default-1',
              hotelName: 'The Grand Heritage Residency',
              city: 'Chennai',
              address: '124 East Coast Road, Kovalam, Chennai',
              description: 'Seaside luxury boutique stay featuring infinity sea pool, private beach access, and authentic Chettinad culinary dining.',
              amenities: ['Sea View', 'Private Beach', 'Swimming Pool', 'Wi-Fi'],
              images: ['https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80'],
              contactInformation: { phone: '+91 98401 23456', email: 'kovalam@grandheritage.com' }
            },
            {
              _id: 'default-2',
              hotelName: 'Palazzo Cyber Suites',
              city: 'Chennai OMR',
              address: '88 IT Expressway, Navalur, Chennai',
              description: 'Contemporary tech-corridor residency crafted for business travelers and corporate staycations.',
              amenities: ['Business Lounge', 'High-Speed Wi-Fi', 'Gym', 'Valet'],
              images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'],
              contactInformation: { phone: '+91 81100 18708', email: 'stay@palazzocyber.com' }
            },
            {
              _id: 'default-3',
              hotelName: 'Shoreline Heritage Villa',
              city: 'Mahabalipuram',
              address: '15 Shore Temple Road, Mahabalipuram',
              description: 'Stone-architecture villa retreat walking distance from historic UNESCO heritage monuments.',
              amenities: ['Heritage Architecture', 'Surf Club', 'Spa', 'Bistro'],
              images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80'],
              contactInformation: { phone: '+91 94441 55667', email: 'concierge@shorelineresort.in' }
            }
          ]).map((partner: any) => {
            const hotelTitle = partner.hotelName || partner.name || 'Grand Partner Hotel';
            const hotelAddress = partner.address || partner.location?.address || 'East Coast Road';
            const hotelCity = partner.city || partner.location?.city || 'Chennai';
            const hotelPhone =
              partner.contactInformation?.phone || partner.contact?.phone || '+91 81100 18708';
            const displayImage =
              partner.images && partner.images.length > 0
                ? partner.images[0]
                : 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80';

            return (
              <div
                key={partner._id}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                  <img
                    src={displayImage}
                    alt={hotelTitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-[#487FFF] text-white shadow-sm">
                      Partner Hotel
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">{hotelTitle}</h3>
                    {partner.description && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{partner.description}</p>
                    )}
                    <div className="mt-2.5 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-4 h-4 text-[#487FFF] shrink-0 mt-0.5" />
                      <span>
                        {hotelAddress}, {hotelCity}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {partner.amenities?.slice(0, 3).map((a: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600/40"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#487FFF]" />
                      <span>{hotelPhone}</span>
                    </div>
                    <a href={`tel:${hotelPhone.replace(/\s+/g, '')}`}>
                      <Button variant="outline" size="sm">
                        Contact Desk
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
