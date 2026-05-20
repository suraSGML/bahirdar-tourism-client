import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import API from '../api/axios';

export default function SocialSharing({ itemType, itemId, itemName }) {
  const [shareUrls, setShareUrls] = useState(null);
  const [shareText, setShareText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetchShareData();
  }, [itemType, itemId]);

  const fetchShareData = async () => {
    try {
      setLoading(true);
      const [urlsRes, textRes] = await Promise.all([
        API.get(`/share/${itemType}/${itemId}/urls`),
        API.get(`/share/${itemType}/${itemId}/text`),
      ]);
      setShareUrls(urlsRes.data);
      setShareText(textRes.data);
    } catch (err) {
      toast.error('Failed to load sharing options');
    } finally {
      setLoading(false);
    }
  };

  const trackShare = async (platform) => {
    try {
      await API.post(`/share/${itemType}/${itemId}/track/${platform}`);
    } catch (err) {
      // Silently fail for tracking
    }
  };

  const handleShare = (platform, url) => {
    trackShare(platform);
    window.open(url, '_blank', 'width=600,height=400');
    setShowMenu(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${itemType}/${itemId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
    setShowMenu(false);
  };

  if (loading) return <button className="px-3 py-1 text-sm bg-gray-200 rounded">Loading...</button>;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
      >
        📤 Share
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
          <div className="p-2 space-y-1">
            {shareUrls?.facebook && (
              <button
                onClick={() => handleShare('facebook', shareUrls.facebook)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <span>👍</span> Facebook
              </button>
            )}
            {shareUrls?.twitter && (
              <button
                onClick={() => handleShare('twitter', shareUrls.twitter)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <span>𝕏</span> Twitter
              </button>
            )}
            {shareUrls?.whatsapp && (
              <button
                onClick={() => handleShare('whatsapp', shareUrls.whatsapp)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <span>💬</span> WhatsApp
              </button>
            )}
            {shareUrls?.telegram && (
              <button
                onClick={() => handleShare('telegram', shareUrls.telegram)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <span>✈️</span> Telegram
              </button>
            )}
            {shareUrls?.email && (
              <button
                onClick={() => handleShare('email', shareUrls.email)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <span>✉️</span> Email
              </button>
            )}
            <div className="border-t my-1"></div>
            <button
              onClick={handleCopyLink}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
            >
              <span>🔗</span> Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
