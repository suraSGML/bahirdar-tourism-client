import { useState } from 'react';
import { toast } from 'react-toastify';
import API from '../api/axios';

export default function BookingCancellation({ booking, onCancelled }) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCancellation = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post(`/bookings/${booking._id}/cancel`, { reason });
      toast.success('Cancellation request submitted');
      setShowForm(false);
      setReason('');
      onCancelled?.(res.data.booking);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request cancellation');
    } finally {
      setLoading(false);
    }
  };

  if (booking.status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <div className="text-red-800 font-semibold">❌ Booking Cancelled</div>
        {booking.refundAmount > 0 && (
          <div className="text-sm text-red-700 mt-2">
            Refund Amount: ETB {booking.refundAmount}
            <br />
            Refund Status: {booking.refundStatus}
          </div>
        )}
      </div>
    );
  }

  if (booking.cancellationStatus === 'pending') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <div className="text-yellow-800 font-semibold">⏳ Cancellation Pending</div>
        <div className="text-sm text-yellow-700 mt-2">
          Your cancellation request is being reviewed by admin.
          <br />
          Reason: {booking.cancellationReason}
        </div>
      </div>
    );
  }

  if (booking.cancellationStatus === 'rejected') {
    return (
      <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
        <div className="text-orange-800 font-semibold">❌ Cancellation Rejected</div>
        <div className="text-sm text-orange-700 mt-2">
          Reason: {booking.cancellationReason}
        </div>
      </div>
    );
  }

  return (
    <div>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Request Cancellation
        </button>
      ) : (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg space-y-3">
          <div className="font-semibold text-red-800">Request Cancellation</div>
          
          <div className="bg-white p-3 rounded border border-red-200 text-sm">
            <div className="font-semibold mb-2">Refund Policy:</div>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>More than 14 days before: 80% refund</li>
              <li>7-14 days before: 50% refund</li>
              <li>Less than 7 days: No refund</li>
            </ul>
          </div>

          <textarea
            placeholder="Why do you want to cancel? (required)"
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            rows="3"
          />

          <div className="flex gap-2">
            <button
              onClick={handleRequestCancellation}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Cancellation Request'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setReason('');
              }}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
