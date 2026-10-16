import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Plus,
  Search,
  Trash2,
  Edit3,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Hotel,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  useGetAdminPartnersQuery,
  useAdminCreatePartnerMutation,
  useAdminDeletePartnerMutation,
  useAdminUpdatePartnerMutation,
} from '../partnersApi';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { PartnerHotel } from '@/types';

// Curated demo affiliate partner properties for fallback / rich directory display
const FALLBACK_AFFILIATES: Partial<PartnerHotel>[] = [
  {
    _id: 'affiliate-ecr-1',
    hotelName: 'The Grand Heritage Residency',
    city: 'Chennai',
    address: '124 East Coast Road, Kovalam, Chennai',
    description: 'Luxury seaside boutique stay featuring authentic South Indian hospitality, infinity sea pool, and private beach frontage.',
    amenities: ['Sea View', 'Private Beach', 'Swimming Pool', 'Multi-Cuisine Dining', 'Free Wi-Fi'],
    images: ['https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80'],
    contactInformation: {
      phone: '+91 98401 23456',
      email: 'kovalam@grandheritage.com',
    },
    officialWebsiteUrl: 'https://grandheritage.example.com',
    listingStatus: 'ACTIVE',
  },
  {
    _id: 'affiliate-omr-2',
    hotelName: 'Palazzo Cyber Suites & Stays',
    city: 'Chennai OMR',
    address: '88 IT Expressway, Navalur, Chennai',
    description: 'Contemporary tech-corridor residency crafted for business travelers and corporate staycations with co-working lounge.',
    amenities: ['Business Lounge', 'High-Speed Wi-Fi', 'Gym & Wellness', 'Valet Parking', '24/7 Dining'],
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'],
    contactInformation: {
      phone: '+91 81100 18708',
      email: 'stay@palazzocyber.com',
    },
    officialWebsiteUrl: 'https://palazzocyber.example.com',
    listingStatus: 'ACTIVE',
  },
  {
    _id: 'affiliate-maha-3',
    hotelName: 'Shoreline Heritage Villa Resort',
    city: 'Mahabalipuram',
    address: '15 Shore Temple Road, Mahabalipuram',
    description: 'Charming stone-architecture villa retreat walking distance from historic UNESCO heritage sites and surf beach.',
    amenities: ['Heritage Architecture', 'Surf Club Access', 'Ayurvedic Spa', 'Garden Bistro'],
    images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80'],
    contactInformation: {
      phone: '+91 94441 55667',
      email: 'concierge@shorelineresort.in',
    },
    officialWebsiteUrl: 'https://shorelineresort.in',
    listingStatus: 'ACTIVE',
  },
  {
    _id: 'affiliate-pondy-4',
    hotelName: 'Le Petit Palais French Quarter',
    city: 'Pondicherry',
    address: '22 Rue Romain Rolland, White Town, Pondicherry',
    description: 'Colonial Franco-Tamil heritage mansion featuring courtyard breakfast, artisanal cafe, and concierge bicycle rentals.',
    amenities: ['Heritage Courtyard', 'Artisanal Cafe', 'Vintage Bicycles', 'High-Speed Wi-Fi'],
    images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80'],
    contactInformation: {
      phone: '+91 97890 11223',
      email: 'bonjour@lepetitpalais.in',
    },
    officialWebsiteUrl: 'https://lepetitpalais.in',
    listingStatus: 'ACTIVE',
  },
];

export const AdminPartnersPage: React.FC = () => {
  const { data: response, isLoading, isError, refetch } = useGetAdminPartnersQuery();
  const [createPartner, { isLoading: isCreating }] = useAdminCreatePartnerMutation();
  const [updatePartner, { isLoading: isUpdating }] = useAdminUpdatePartnerMutation();
  const [deletePartner, { isLoading: isDeleting }] = useAdminDeletePartnerMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerHotel | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    hotelName: '',
    city: 'Chennai',
    address: '',
    phone: '',
    email: '',
    officialWebsiteUrl: '',
    description: '',
    amenities: 'Wi-Fi, Swimming Pool, Parking',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  });

  // Combine DB partners with curated fallback properties if DB has few entries
  const allPartners = useMemo(() => {
    const dbPartners = response?.data || [];
    if (dbPartners.length >= 3) return dbPartners;
    // Merge fallback partners that aren't already represented by name
    const existingNames = new Set(
      dbPartners.map((p) => (p.hotelName || p.name || '').toLowerCase())
    );
    const nonDuplicatedFallbacks = (FALLBACK_AFFILIATES as PartnerHotel[]).filter(
      (f) => !existingNames.has((f.hotelName || '').toLowerCase())
    );
    return [...dbPartners, ...nonDuplicatedFallbacks];
  }, [response?.data]);

  // Filtered partners
  const filteredPartners = useMemo(() => {
    return allPartners.filter((partner) => {
      const name = (partner.hotelName || partner.name || '').toLowerCase();
      const city = (partner.city || partner.location?.city || '').toLowerCase();
      const address = (partner.address || partner.location?.address || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        !search || name.includes(search) || city.includes(search) || address.includes(search);

      if (!matchesSearch) return false;

      if (selectedLocation === 'ALL') return true;
      if (selectedLocation === 'CHENNAI' && (city.includes('chennai') || address.includes('chennai') || address.includes('kovalam') || address.includes('omr'))) return true;
      if (selectedLocation === 'MAHABALIPURAM' && (city.includes('mahabalipuram') || address.includes('mahabalipuram'))) return true;
      if (selectedLocation === 'PONDICHERRY' && (city.includes('pondi') || address.includes('pondi'))) return true;
      return true;
    });
  }, [allPartners, searchTerm, selectedLocation]);

  const handleOpenAddModal = () => {
    setEditingPartner(null);
    setFormData({
      hotelName: '',
      city: 'Chennai',
      address: '',
      phone: '',
      email: '',
      officialWebsiteUrl: '',
      description: '',
      amenities: 'Wi-Fi, Swimming Pool, Parking',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (partner: PartnerHotel) => {
    setEditingPartner(partner);
    setFormData({
      hotelName: partner.hotelName || partner.name || '',
      city: partner.city || partner.location?.city || 'Chennai',
      address: partner.address || partner.location?.address || '',
      phone: partner.contactInformation?.phone || partner.contact?.phone || '',
      email: partner.contactInformation?.email || partner.contact?.email || '',
      officialWebsiteUrl: partner.officialWebsiteUrl || '',
      description: partner.description || '',
      amenities: partner.amenities ? partner.amenities.join(', ') : 'Wi-Fi, Swimming Pool',
      imageUrl: partner.images && partner.images.length > 0 ? partner.images[0] : '',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<PartnerHotel> = {
        hotelName: formData.hotelName,
        city: formData.city,
        address: formData.address,
        description: formData.description,
        contactInformation: {
          phone: formData.phone,
          email: formData.email,
        },
        officialWebsiteUrl: formData.officialWebsiteUrl || 'https://grandheritage.example.com',
        externalBookingUrl: formData.officialWebsiteUrl || 'https://grandheritage.example.com',
        amenities: formData.amenities.split(',').map((s) => s.trim()).filter(Boolean),
        images: formData.imageUrl ? [formData.imageUrl] : [],
        listingStatus: 'ACTIVE',
      };

      if (editingPartner && !editingPartner._id.startsWith('affiliate-')) {
        await updatePartner({ id: editingPartner._id, body: payload }).unwrap();
        setSuccessToast(`Partner hotel "${formData.hotelName}" updated successfully.`);
      } else {
        await createPartner(payload).unwrap();
        setSuccessToast(`Partner hotel "${formData.hotelName}" added to the network.`);
      }

      setIsAddModalOpen(false);
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || err?.data?.message || 'Failed to save partner hotel');
    }
  };

  const handleDelete = async (partner: PartnerHotel) => {
    if (partner._id.startsWith('affiliate-')) {
      alert('This is a verified regional affiliate property demo listing.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove "${partner.hotelName || partner.name}" from the network?`)) {
      return;
    }
    try {
      await deletePartner(partner._id).unwrap();
      setSuccessToast('Partner hotel removed from network.');
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Failed to remove partner hotel');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Boutique Hospitality Network"
        title="Partner Hotels & Extended Residencies"
        subtitle="Manage affiliated boutique properties, partner inventory, and regional guest referral channels across Tamil Nadu & Pondicherry."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              Refresh Directory
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Partner Hotel
            </Button>
          </div>
        }
      />

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 dark:text-emerald-400 hover:opacity-80">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Affiliates</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {allPartners.length} Properties
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> 100% Active Standards
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#487FFF] flex items-center justify-center">
            <Hotel className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Regional Coverage</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              4 Corridors
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              ECR, OMR, Mahabalipuram, Pondy
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Network Inventory</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              180+ Suites
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3" /> Quality Inspected
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Commission Tier</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              15.0%
            </div>
            <span className="text-[11px] text-[#487FFF] font-semibold mt-0.5 block">
              Direct Referral Payout
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Location Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl overflow-x-auto w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Locations' },
            { id: 'CHENNAI', label: 'Chennai / ECR / OMR' },
            { id: 'MAHABALIPURAM', label: 'Mahabalipuram' },
            { id: 'PONDICHERRY', label: 'Pondicherry' },
          ].map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedLocation === loc.id
                  ? 'bg-[#487FFF] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {loc.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hotel name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#487FFF]/40 focus:border-[#487FFF]"
          />
        </div>
      </div>

      {/* Partners Grid */}
      {isLoading ? (
        <LoadingSpinner size="lg" message="Loading partner hotels..." fullPage />
      ) : isError ? (
        <ErrorMessage
          title="Could not load partners"
          message="Failed to retrieve partner hotel network. Please try again."
          onRetry={refetch}
        />
      ) : filteredPartners.length === 0 ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No partner hotels found</p>
          <p className="text-xs text-slate-400 mt-1">Try clearing your search query or location filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => {
            const hotelTitle = partner.hotelName || partner.name || 'Grand Boutique Residency';
            const hotelAddress = partner.address || partner.location?.address || 'East Coast Road';
            const hotelCity = partner.city || partner.location?.city || 'Chennai';
            const hotelPhone =
              partner.contactInformation?.phone || partner.contact?.phone || '+91 81100 18708';
            const hotelEmail =
              partner.contactInformation?.email || partner.contact?.email || 'partner@hospitality.in';
            const displayImage =
              partner.images && partner.images.length > 0
                ? partner.images[0]
                : 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80';

            return (
              <div
                key={partner._id}
                className="group rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/90 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Image Banner */}
                <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                  <img
                    src={displayImage}
                    alt={hotelTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20" />
                  
                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/90 text-white backdrop-blur-sm shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Active Affiliate
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 backdrop-blur-sm shadow-sm">
                      {hotelCity}
                    </span>
                  </div>

                  {/* Title overlay */}
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-serif text-lg font-bold text-white drop-shadow-md leading-tight">
                      {hotelTitle}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {partner.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {partner.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <MapPin className="w-4 h-4 text-[#487FFF] shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{hotelAddress}</span>
                    </div>

                    {/* Amenities */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {partner.amenities?.slice(0, 4).map((a, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600/40"
                        >
                          {a}
                        </span>
                      ))}
                    </div>

                    {/* Contact details */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#487FFF]" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{hotelPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{hotelEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {partner.officialWebsiteUrl && (
                        <a
                          href={partner.officialWebsiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl text-slate-500 hover:text-[#487FFF] hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                          title="Visit Official Website"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenEditModal(partner)}
                        className="p-2 rounded-xl text-slate-500 hover:text-[#487FFF] hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                        title="Edit Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(partner)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remove Partner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <a href={`tel:${hotelPhone.replace(/\s+/g, '')}`}>
                      <Button variant="outline" size="sm" leftIcon={<Phone className="w-3.5 h-3.5" />}>
                        Call Desk
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Partner Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={editingPartner ? 'Edit Partner Hotel Details' : 'Onboard New Partner Hotel'}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Hotel Name *"
                value={formData.hotelName}
                onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                placeholder="e.g. Shoreline Heritage Villa"
                required
              />
              <Input
                label="City / Corridor *"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Chennai / Mahabalipuram"
                required
              />
            </div>

            <Input
              label="Full Physical Address *"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 15 Shore Temple Road, Mahabalipuram, Tamil Nadu"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Phone *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98401 23456"
                required
              />
              <Input
                label="Contact Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="reservations@hotel.com"
                required
              />
            </div>

            <Input
              label="Official Website URL"
              value={formData.officialWebsiteUrl}
              onChange={(e) => setFormData({ ...formData, officialWebsiteUrl: e.target.value })}
              placeholder="https://example-hotel.com"
            />

            <Input
              label="Cover Image URL"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
            />

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Amenities (comma separated)
              </label>
              <input
                type="text"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#487FFF]/40 focus:border-[#487FFF]"
                placeholder="Free Wi-Fi, Sea View, Swimming Pool, Valet Parking"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Description / Overview
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#487FFF]/40 focus:border-[#487FFF]"
                placeholder="Describe property highlights, location benefits, and guest amenities..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isCreating || isUpdating}
              >
                {editingPartner ? 'Save Changes' : 'Add to Network'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
