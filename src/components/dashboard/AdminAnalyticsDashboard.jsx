import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import API from '../../api/axios';

export default function AdminAnalyticsDashboard() {
  const [overview, setOverview] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [users, setUsers] = useState(null);
  const [hotels, setHotels] = useState(null);
  const [guides, setGuides] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, bookingsRes, revenueRes, usersRes, hotelsRes, guidesRes, reviewsRes] = await Promise.all([
        API.get('/analytics/overview'),
        API.get('/analytics/bookings'),
        API.get('/analytics/revenue'),
        API.get('/analytics/users'),
        API.get('/analytics/hotels'),
        API.get('/analytics/guides'),
        API.get('/analytics/reviews'),
      ]);

      setOverview(overviewRes.data);
      setBookings(bookingsRes.data);
      setRevenue(revenueRes.data);
      setUsers(usersRes.data);
      setHotels(hotelsRes.data);
      setGuides(guidesRes.data);
      setReviews(reviewsRes.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Total Bookings</div>
          <div className="text-3xl font-bold text-primary-600">{overview?.totalBookings || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Total Hotels</div>
          <div className="text-3xl font-bold text-blue-600">{overview?.totalHotels || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Total Guides</div>
          <div className="text-3xl font-bold text-green-600">{overview?.totalGuides || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Total Users</div>
          <div className="text-3xl font-bold text-purple-600">{overview?.totalUsers || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Total Revenue</div>
          <div className="text-3xl font-bold text-orange-600">ETB {overview?.totalRevenue?.toLocaleString() || 0}</div>
        </div>
      </div>

      {/* Bookings Analytics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">Bookings Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold mb-2">By Status</h4>
            {bookings?.byStatus?.map(item => (
              <div key={item._id} className="flex justify-between py-1">
                <span className="capitalize">{item._id}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-semibold mb-2">By Type</h4>
            {bookings?.byType?.map(item => (
              <div key={item._id} className="flex justify-between py-1">
                <span className="capitalize">{item._id}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-semibold mb-2">By Payment Status</h4>
            {bookings?.byPaymentStatus?.map(item => (
              <div key={item._id} className="flex justify-between py-1">
                <span className="capitalize">{item._id}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Analytics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">Revenue Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">By Booking Type</h4>
            {revenue?.byType?.map(item => (
              <div key={item._id} className="flex justify-between py-1">
                <span className="capitalize">{item._id}</span>
                <span className="font-semibold">ETB {item.total?.toLocaleString()} ({item.count} bookings)</span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-semibold mb-2">By Payment Method</h4>
            {revenue?.byPaymentMethod?.map(item => (
              <div key={item._id} className="flex justify-between py-1">
                <span className="capitalize">{item._id}</span>
                <span className="font-semibold">ETB {item.total?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Analytics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">User Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Users by Role</h4>
            {users?.byRole?.map(item => (
              <div key={item._id} className="flex justify-between py-1">
                <span className="capitalize">{item._id}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-semibold mb-2">Top Active Users</h4>
            {users?.activeUsers?.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex justify-between py-1">
                <span>User {idx + 1}</span>
                <span className="font-semibold">{item.bookingCount} bookings</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hotel Analytics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">Hotel Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Top Hotels</h4>
            {hotels?.topHotels?.slice(0, 5).map(hotel => (
              <div key={hotel._id} className="py-1 text-sm">
                <div className="font-semibold">{hotel.name}</div>
                <div className="text-gray-500">{hotel.rating}⭐ ({hotel.numReviews} reviews)</div>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-semibold mb-2">By Rating</h4>
            {hotels?.hotelsByRating?.map(item => (
              <div key={item._id} className="flex justify-between py-1">
                <span>{item._id}⭐</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-semibold mb-2">By Price Range</h4>
            {hotels?.hotelsByPrice?.map(item => (
              <div key={item._id} className="flex justify-between py-1">
                <span>{item._id}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guide Analytics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">Guide Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Top Guides</h4>
            {guides?.topGuides?.slice(0, 5).map((guide, idx) => (
              <div key={idx} className="py-1 text-sm">
                <div className="font-semibold">{guide.userData?.[0]?.name || 'Guide'}</div>
                <div className="text-gray-500">{guide.rating}⭐ ({guide.numReviews} reviews)</div>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-semibold mb-2">Languages</h4>
            {guides?.guidesByLanguage?.slice(0, 5).map(item => (
              <div key={item._id} className="flex justify-between py-1">
                <span>{item._id}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-semibold mb-2">Specialties</h4>
            {guides?.guidesBySpecialty?.slice(0, 5).map(item => (
              <div key={item._id} className="flex justify-between py-1 text-sm">
                <span>{item._id}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Analytics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">Review Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold mb-2">By Rating</h4>
            {reviews?.byRating?.map(item => (
              <div key={item._id} className="flex justify-between py-1">
                <span>{item._id}⭐</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-semibold mb-2">By Type</h4>
            {reviews?.byType?.map(item => (
              <div key={item._id} className="flex justify-between py-1">
                <span className="capitalize">{item._id}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-semibold mb-2">Overall Stats</h4>
            <div className="py-1">
              <div className="flex justify-between">
                <span>Average Rating</span>
                <span className="font-semibold">{reviews?.averageRating?.average?.toFixed(2)}⭐</span>
              </div>
              <div className="flex justify-between">
                <span>Total Reviews</span>
                <span className="font-semibold">{reviews?.averageRating?.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
