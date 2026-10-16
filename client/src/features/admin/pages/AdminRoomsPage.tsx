import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Sparkles, Wrench, Plus, CheckCircle, RefreshCw, ShieldAlert, Calendar } from 'lucide-react';
import {
  useGetAdminRoomsQuery,
  useAdminUpdateRoomMutation,
  useAdminSetRoomMaintenanceMutation,
  useAdminRemoveRoomMaintenanceMutation,
  useAdminCreateRoomMutation,
} from '../dashboardApi';
import { useGetRoomTypesQuery } from '@/features/rooms/roomsApi';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Room } from '@/types';

export const AdminRoomsPage: React.FC = () => {
  const [floorFilter, setFloorFilter] = useState<number | undefined>(undefined);

  const {
    data: roomsResponse,
    isLoading,
    isError,
    refetch,
  } = useGetAdminRoomsQuery({ floor: floorFilter });

  const { data: roomTypesResponse } = useGetRoomTypesQuery();

  const [updateRoom] = useAdminUpdateRoomMutation();
  const [setMaintenance] = useAdminSetRoomMaintenanceMutation();
  const [removeMaintenance] = useAdminRemoveRoomMaintenanceMutation();
  const [createRoom, { isLoading: isCreating }] = useAdminCreateRoomMutation();

  const [maintenanceModalRoom, setMaintenanceModalRoom] = useState<Room | null>(null);
  const [maintenanceReason, setMaintenanceReason] = useState<string>('AC Servicing / Plumbing repair');

  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState(1);
  const [newRoomTypeId, setNewRoomTypeId] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const rooms = roomsResponse?.data || [];
  const roomTypes = roomTypesResponse?.data || [];

  const handleHousekeepingChange = async (room: Room, newStatus: string) => {
    try {
      await updateRoom({
        id: room._id,
        body: { housekeepingStatus: newStatus as any },
      }).unwrap();
      setSuccessToast(`Room ${room.roomNumber} status set to ${newStatus}`);
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Update failed');
    }
  };

  const handleApplyMaintenance = async () => {
    if (!maintenanceModalRoom) return;
    try {
      await setMaintenance({
        id: maintenanceModalRoom._id,
        reason: maintenanceReason,
      }).unwrap();

      setMaintenanceModalRoom(null);
      setSuccessToast(`Room ${maintenanceModalRoom.roomNumber} blocked for maintenance.`);
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Failed to set maintenance block');
    }
  };

  const handleRemoveMaintenance = async (room: Room) => {
    try {
      await removeMaintenance(room._id).unwrap();
      setSuccessToast(`Room ${room.roomNumber} maintenance released.`);
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Failed to release maintenance block');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber || !newRoomTypeId) return;

    try {
      await createRoom({
        roomNumber: newRoomNumber,
        floor: Number(newRoomFloor),
        roomTypeId: newRoomTypeId,
        status: 'ACTIVE',
        housekeepingStatus: 'CLEAN',
        amenities: ['High-speed Wi-Fi', 'Air Conditioning', 'Smart TV'],
      }).unwrap();

      setIsAddRoomModalOpen(false);
      setNewRoomNumber('');
      setSuccessToast(`Room ${newRoomNumber} created successfully`);
      refetch();
    } catch (err: any) {
      alert(err?.data?.error?.message || 'Room creation failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Physical Inventory"
        title="Rooms & Housekeeping Desk"
        subtitle="Live monitor of room cleaning cycles (Clean, Dirty, Inspected) and maintenance blocks."
        actions={
          <div className="flex items-center gap-2.5">
            <Link to="/admin/dashboard?tab=calendar">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Calendar className="w-4 h-4 text-[#487FFF]" />}
              >
                Date-wise Calendar View
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (roomTypes.length > 0) setNewRoomTypeId(roomTypes[0]._id);
                setIsAddRoomModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              + Add Room
            </Button>
          </div>
        }
      />

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 dark:text-emerald-400 hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Floor Filter Tabs */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Filter Floor:</span>
        <div className="flex items-center p-1 bg-[#F1F5F9] dark:bg-slate-800/80 rounded-xl shadow-xs gap-1">
          {[undefined, 1, 2, 3].map((fl) => (
            <button
              key={fl ?? 'all'}
              onClick={() => setFloorFilter(fl)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                floorFilter === fl
                  ? 'bg-[#487FFF] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {fl === undefined ? 'All Floors' : `Floor ${fl}`}
            </button>
          ))}
        </div>
      </div>

      {/* Room Grid */}
      {isLoading ? (
        <LoadingSpinner size="lg" message="Loading rooms inventory..." fullPage />
      ) : isError ? (
        <ErrorMessage
          title="Failed to load rooms"
          message="Could not load physical rooms from the database."
          onRetry={refetch}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {rooms.map((room) => {
            const rt = typeof room.roomTypeId === 'object' ? room.roomTypeId : null;
            const isMaintenance = room.status === 'MAINTENANCE';

            return (
              <div
                key={room._id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:shadow-md ${
                  isMaintenance
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                    : 'bg-white dark:bg-[#1E293B] border-[#EAECF0] dark:border-slate-800 hover:border-[#487FFF]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-2xl font-black text-[#1E293B] dark:text-white tracking-tight">
                      {room.roomNumber}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                      Floor {room.floor}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-[#487FFF] truncate">
                    {rt?.name || 'Deluxe Room'}
                  </p>

                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    <StatusBadge status={room.housekeepingStatus} size="sm" />
                    <StatusBadge status={room.status} size="sm" />
                    {room.isOccupied ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-[#EF4444] border border-rose-200/50 dark:border-rose-800/50">
                        OCCUPIED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981] border border-emerald-200/50 dark:border-emerald-800/50">
                        VACANT
                      </span>
                    )}
                  </div>

                  {room.isOccupied && room.currentBooking && (
                    <div className="mt-3.5 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-[11px] space-y-1">
                      <div className="flex justify-between items-center text-[#1E293B] dark:text-white font-bold">
                        <span className="truncate mr-1">Guest: {room.currentBooking.guestName}</span>
                        <span className="font-mono text-[10px] text-[#487FFF] shrink-0">
                          {room.currentBooking.bookingReference}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Until {room.currentBooking.checkOutDate} ({room.currentBooking.stayType || 'DAILY'})
                      </p>
                    </div>
                  )}

                  {isMaintenance && room.maintenanceBlock?.reason && (
                    <div className="mt-3.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-800 dark:text-rose-300">
                      <strong className="block text-rose-900 dark:text-rose-200 font-bold mb-0.5">
                        Maintenance Alert:
                      </strong>
                      {room.maintenanceBlock.reason}
                    </div>
                  )}
                </div>

                {/* Quick Housekeeping & Maintenance Actions */}
                <div className="mt-5 pt-3.5 border-t border-[#EAECF0] dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Housekeeping:</span>
                    <select
                      value={room.housekeepingStatus}
                      onChange={(e) => handleHousekeepingChange(room, e.target.value)}
                      className="bg-[#F8F9FA] dark:bg-slate-800 text-[#1E293B] dark:text-white font-semibold rounded-lg border border-[#EAECF0] dark:border-slate-700 px-2.5 py-1 text-[11px] outline-none focus:border-[#487FFF]"
                    >
                      <option value="CLEAN">CLEAN</option>
                      <option value="DIRTY">DIRTY</option>
                      <option value="INSPECTED">INSPECTED</option>
                      <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                    </select>
                  </div>

                  <div className="pt-0.5">
                    {isMaintenance ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        onClick={() => handleRemoveMaintenance(room)}
                      >
                        Release Maintenance
                      </Button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMaintenanceModalRoom(room)}
                        className="w-full text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-[#487FFF] dark:hover:text-[#487FFF] transition-colors py-1"
                      >
                        + Set Maintenance Block
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Maintenance Modal */}
      {maintenanceModalRoom && (
        <Modal
          isOpen={Boolean(maintenanceModalRoom)}
          onClose={() => setMaintenanceModalRoom(null)}
          title={`Set Maintenance Block: Room ${maintenanceModalRoom.roomNumber}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Setting maintenance stops this room from being assigned or booked by guests until released.
            </p>

            <Input
              label="Reason for Maintenance"
              value={maintenanceReason}
              onChange={(e) => setMaintenanceReason(e.target.value)}
              placeholder="e.g. Air conditioning compressor replacement"
              required
            />

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EAECF0] dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setMaintenanceModalRoom(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleApplyMaintenance}>
                Apply Maintenance Block
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Room Modal */}
      {isAddRoomModalOpen && (
        <Modal
          isOpen={isAddRoomModalOpen}
          onClose={() => setIsAddRoomModalOpen(false)}
          title="Add Physical Room to Inventory"
        >
          <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
            <Input
              label="Room Number"
              placeholder="e.g. 107 or 401"
              value={newRoomNumber}
              onChange={(e) => setNewRoomNumber(e.target.value)}
              required
            />

            <Select
              label="Floor Number"
              value={newRoomFloor}
              onChange={(e) => setNewRoomFloor(Number(e.target.value))}
              options={[
                { label: 'Floor 1', value: 1 },
                { label: 'Floor 2', value: 2 },
                { label: 'Floor 3', value: 3 },
              ]}
            />

            <Select
              label="Room Type"
              value={newRoomTypeId}
              onChange={(e) => setNewRoomTypeId(e.target.value)}
              options={roomTypes.map((rt) => ({
                label: `${rt.name} (${rt.category})`,
                value: rt._id,
              }))}
            />

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EAECF0] dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setIsAddRoomModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
                Create Room
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
