import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import API from '../api/axios';

export default function ItineraryBuilder() {
  const [itinerary, setItinerary] = useState(null);
  const [tripName, setTripName] = useState('My Bahir Dar Trip');
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState(null);
  const [newActivity, setNewActivity] = useState({ title: '', description: '', time: '', location: '' });

  useEffect(() => {
    fetchItinerary();
  }, []);

  const fetchItinerary = async () => {
    try {
      const res = await API.get('/itinerary');
      setItinerary(res.data);
      setTripName(res.data.tripName);
    } catch (err) {
      toast.error('Failed to load itinerary');
    } finally {
      setLoading(false);
    }
  };

  const updateTripName = async () => {
    try {
      const res = await API.put('/itinerary/name', { tripName });
      setItinerary(res.data.itinerary);
      toast.success('Trip name updated');
    } catch (err) {
      toast.error('Failed to update trip name');
    }
  };

  const addDay = async () => {
    try {
      const res = await API.post('/itinerary/days', {
        dayNumber: (itinerary?.days?.length || 0) + 1,
        date: new Date().toISOString().split('T')[0],
        activities: [],
      });
      setItinerary(res.data.itinerary);
      toast.success('Day added');
    } catch (err) {
      toast.error('Failed to add day');
    }
  };

  const addActivity = async (dayNumber) => {
    if (!newActivity.title) {
      toast.error('Activity title is required');
      return;
    }

    try {
      const res = await API.post(`/itinerary/days/${dayNumber}/activities`, {
        ...newActivity,
        type: 'custom',
      });
      setItinerary(res.data.itinerary);
      setNewActivity({ title: '', description: '', time: '', location: '' });
      setEditingDay(null);
      toast.success('Activity added');
    } catch (err) {
      toast.error('Failed to add activity');
    }
  };

  const removeActivity = async (dayNumber, activityId) => {
    try {
      const res = await API.delete(`/itinerary/days/${dayNumber}/activities/${activityId}`);
      setItinerary(res.data.itinerary);
      toast.success('Activity removed');
    } catch (err) {
      toast.error('Failed to remove activity');
    }
  };

  const deleteDay = async (dayNumber) => {
    if (!window.confirm('Delete this day?')) return;

    try {
      const res = await API.delete(`/itinerary/days/${dayNumber}`);
      setItinerary(res.data.itinerary);
      toast.success('Day deleted');
    } catch (err) {
      toast.error('Failed to delete day');
    }
  };

  const clearItinerary = async () => {
    if (!window.confirm('Clear entire itinerary?')) return;

    try {
      const res = await API.delete('/itinerary/clear');
      setItinerary(res.data.itinerary);
      toast.success('Itinerary cleared');
    } catch (err) {
      toast.error('Failed to clear itinerary');
    }
  };

  const exportItinerary = async () => {
    try {
      const res = await API.get('/itinerary/export');
      const dataStr = JSON.stringify(res.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tripName}.json`;
      link.click();
      toast.success('Itinerary exported');
    } catch (err) {
      toast.error('Failed to export itinerary');
    }
  };

  if (loading) return <div className="text-center py-10">Loading itinerary...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={tripName}
            onChange={e => setTripName(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg"
            placeholder="Trip name"
          />
          <button onClick={updateTripName} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
            Save Name
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={addDay} className="px-4 py-2 bg-green-600 text-white rounded-lg">
            + Add Day
          </button>
          <button onClick={exportItinerary} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            📥 Export
          </button>
          <button onClick={clearItinerary} className="px-4 py-2 bg-red-600 text-white rounded-lg">
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Days */}
      <div className="space-y-4">
        {itinerary?.days?.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No days yet. Click "Add Day" to start building your itinerary.
          </div>
        ) : (
          itinerary?.days?.map(day => (
            <div key={day.dayNumber} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold">Day {day.dayNumber}</h3>
                  <input
                    type="date"
                    defaultValue={day.date?.split('T')[0]}
                    onChange={e => {
                      // Update day date
                    }}
                    className="px-2 py-1 border rounded text-sm"
                  />
                </div>
                <button
                  onClick={() => deleteDay(day.dayNumber)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                >
                  Delete
                </button>
              </div>

              {/* Activities */}
              <div className="space-y-2 mb-4">
                {day.activities?.map(activity => (
                  <div key={activity._id} className="bg-gray-50 p-3 rounded flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold">{activity.title}</div>
                      {activity.time && <div className="text-sm text-gray-600">⏰ {activity.time}</div>}
                      {activity.location && <div className="text-sm text-gray-600">📍 {activity.location}</div>}
                      {activity.description && <div className="text-sm text-gray-700 mt-1">{activity.description}</div>}
                    </div>
                    <button
                      onClick={() => removeActivity(day.dayNumber, activity._id)}
                      className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Activity Form */}
              {editingDay === day.dayNumber ? (
                <div className="bg-blue-50 p-4 rounded space-y-2">
                  <input
                    type="text"
                    placeholder="Activity title"
                    value={newActivity.title}
                    onChange={e => setNewActivity({ ...newActivity, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={newActivity.location}
                    onChange={e => setNewActivity({ ...newActivity, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="time"
                    value={newActivity.time}
                    onChange={e => setNewActivity({ ...newActivity, time: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                  <textarea
                    placeholder="Description"
                    value={newActivity.description}
                    onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    rows="2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => addActivity(day.dayNumber)}
                      className="px-4 py-2 bg-green-600 text-white rounded"
                    >
                      Add Activity
                    </button>
                    <button
                      onClick={() => setEditingDay(null)}
                      className="px-4 py-2 bg-gray-400 text-white rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditingDay(day.dayNumber)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded"
                >
                  + Add Activity
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
