import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import API from '../api/axios';

export default function ImageUpload({ onUpload, multiple = false }) {
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const prevPreviewsRef = useRef([]);

  useEffect(() => {
    prevPreviewsRef.current = previews;
  }, [previews]);

  // Revoke all object URLs on unmount
  useEffect(() => {
    return () => {
      prevPreviewsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Revoke previous previews before creating new ones
    prevPreviewsRef.current.forEach(url => URL.revokeObjectURL(url));
    const previewUrls = files.map(f => URL.createObjectURL(f));
    setPreviews(previewUrls);

    setLoading(true);
    try {
      const formData = new FormData();
      if (multiple) {
        files.forEach(f => formData.append('images', f));
        const { data } = await API.post('/upload/multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        onUpload(data.urls);
        toast.success(`${data.urls.length} image(s) uploaded!`);
      } else {
        formData.append('image', files[0]);
        const { data } = await API.post('/upload/single', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        onUpload(data.url);
        toast.success('Image uploaded!');
      }
    } catch {
      toast.error('Image upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <label style={styles.label}>
        {loading ? '⏳ Uploading...' : `📷 ${multiple ? 'Upload Images' : 'Upload Image'}`}
        <input type="file" accept="image/*" multiple={multiple} onChange={handleChange} style={styles.input} disabled={loading} />
      </label>
      {previews.length > 0 && (
        <div style={styles.previews}>
          {previews.map((p, i) => <img key={i} src={p} alt="" style={styles.preview} />)}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { marginBottom: '0.5rem' },
  label: { display: 'inline-block', padding: '0.7rem 1.2rem', background: '#e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem' },
  input: { display: 'none' },
  previews: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.8rem' },
  preview: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' },
};
