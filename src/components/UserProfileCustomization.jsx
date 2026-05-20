import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import API from '../api/axios';
import ImageUpload from './ImageUpload';

export default function UserProfileCustomization() {
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    profileImage: '',
  });
  const [prefData, setPrefData] = useState({
    language: 'en',
    currency: 'ETB',
    notifications: true,
    theme: 'light',
  });

  useEffect(() => {
    fetchProfile();
    fetchPreferences();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/users/profile');
      setProfile(res.data);
      setFormData({
        name: res.data.name,
        phone: res.data.phone || '',
        profileImage: res.data.profileImage || '',
      });
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await API.get('/users/preferences');
      setPrefData(res.data);
    } catch (err) {
      // Preferences might not exist yet
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await API.put('/users/profile', formData);
      setProfile(res.data.user);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      const res = await API.put('/users/preferences', prefData);
      setPrefData(res.data.preferences);
      toast.success('Preferences updated successfully');
    } catch (err) {
      toast.error('Failed to update preferences');
    }
  };

  if (loading) return <div className="text-center py-10">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">My Profile</h2>

        {!editing ? (
          <div className="space-y-4">
            {profile?.profileImage && (
              <div className="flex justify-center">
                <img
                  src={profile.profileImage}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              </div>
            )}
            <div>
              <label className="text-gray-600 text-sm">Name</label>
              <div className="text-lg font-semibold">{profile?.name}</div>
            </div>
            <div>
              <label className="text-gray-600 text-sm">Email</label>
              <div className="text-lg">{profile?.email}</div>
            </div>
            <div>
              <label className="text-gray-600 text-sm">Phone</label>
              <div className="text-lg">{profile?.phone || 'Not provided'}</div>
            </div>
            <div>
              <label className="text-gray-600 text-sm">Role</label>
              <div className="text-lg capitalize">{profile?.role?.replace(/_/g, ' ')}</div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Profile Photo</label>
              <ImageUpload
                onUpload={url => setFormData({ ...formData, profileImage: url })}
              />
              {formData.profileImage && (
                <img
                  src={formData.profileImage}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover mt-2"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="+251..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpdateProfile}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    name: profile?.name,
                    phone: profile?.phone || '',
                    profileImage: profile?.profileImage || '',
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preferences Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Preferences</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Language</label>
            <select
              value={prefData.language}
              onChange={e => setPrefData({ ...prefData, language: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="en">English</option>
              <option value="am">Amharic</option>
              <option value="ar">Arabic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Currency</label>
            <select
              value={prefData.currency}
              onChange={e => setPrefData({ ...prefData, currency: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="ETB">Ethiopian Birr (ETB)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Theme</label>
            <select
              value={prefData.theme}
              onChange={e => setPrefData({ ...prefData, theme: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="notifications"
              checked={prefData.notifications}
              onChange={e => setPrefData({ ...prefData, notifications: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="notifications" className="ml-2 text-sm font-semibold">
              Enable Email Notifications
            </label>
          </div>

          <button
            onClick={handleUpdatePreferences}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Favorites Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">My Favorites</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Hotels ({profile?.favorites?.hotels?.length || 0})</h3>
            <div className="space-y-2">
              {profile?.favorites?.hotels?.map(hotel => (
                <div key={hotel._id} className="text-sm p-2 bg-gray-50 rounded">
                  {hotel.name}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Guides ({profile?.favorites?.guides?.length || 0})</h3>
            <div className="space-y-2">
              {profile?.favorites?.guides?.map(guide => (
                <div key={guide._id} className="text-sm p-2 bg-gray-50 rounded">
                  {guide.name}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Sites ({profile?.favorites?.sites?.length || 0})</h3>
            <div className="space-y-2">
              {profile?.favorites?.sites?.map(site => (
                <div key={site._id} className="text-sm p-2 bg-gray-50 rounded">
                  {site.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
