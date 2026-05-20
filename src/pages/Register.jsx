import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const roles = [
  { value: 'tourist', label: '🧳 Tourist', desc: 'Browse & book hotels, guides and transport' },
  { value: 'hotel_owner', label: '🏨 Hotel Owner', desc: 'List your property and manage bookings' },
  { value: 'guide', label: '🧭 Tour Guide', desc: 'Offer your guiding services to tourists' },
  { value: 'transport_owner', label: '🚤 Transport Provider', desc: 'Offer boat, taxi or bus services' },
];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'tourist', phone: '', requestMessage: '' });
  const [pending, setPending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const needsApproval = ['hotel_owner', 'guide', 'transport_owner'].includes(form.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Full name is required');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (needsApproval && !form.requestMessage.trim()) return toast.error('Please describe your services');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/register', form);
      if (data.pending) { 
        setPending(true); 
        setPendingMessage(data.message); 
      } else { 
        login(data.user); // Token is now in httpOnly cookie
        toast.success('Account created!'); 
        navigate('/dashboard'); 
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      const errorCode = err.response?.data?.code;
      
      if (errorCode === 'VAL_001') {
        const field = err.response?.data?.errors?.[0]?.field;
        toast.error(`Invalid ${field}: ${err.response?.data?.errors?.[0]?.message}`);
      } else if (errorCode === 'CONF_001') {
        toast.error('Email already registered');
      } else {
        toast.error(errorMessage);
      }
    } finally { setLoading(false); }
  };

  if (pending) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="bg-white rounded-3xl shadow-card p-10 max-w-md w-full text-center animate-scale-in">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Request Submitted!</h2>
        <p className="text-gray-500 mb-2">{pendingMessage}</p>
        <p className="text-gray-400 text-sm mb-8">The admin will review your request within 1-2 business days.</p>
        <Link to="/" className="btn-primary inline-block">Back to Home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 relative">
        <img src="https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200"
          alt="Bahir Dar" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 to-primary-600/60 flex flex-col justify-end p-12">
          <h2 className="text-4xl font-bold text-white mb-3">Join Us</h2>
          <p className="text-white/80 text-lg">Be part of Bahir Dar's growing tourism community.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md animate-slide-up py-8">
          <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-xl mb-8 hover:text-primary-700 transition-colors">
            🌍 Visit Bahir Dar
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-400 mb-6">Join thousands of tourists and service providers</p>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {roles.map(r => (
              <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${form.role === r.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}>
                <div className="font-semibold text-sm text-gray-900">{r.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="input" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input className="input" type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <input className="input" placeholder="Phone Number (optional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <div className="relative">
              <input className="input pr-12" type={showPass ? 'text' : 'password'} placeholder="Password (min 8 characters)"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            <input className="input" type="password" placeholder="Confirm Password"
              value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />

            {needsApproval && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-800 font-semibold text-sm mb-1">⚠️ Approval Required</p>
                <p className="text-amber-600 text-xs mb-3">Your account needs admin approval. Describe your services below.</p>
                <textarea className="input text-sm" rows={3}
                  placeholder={form.role === 'hotel_owner' ? 'Describe your hotel (name, location, rooms...)' : form.role === 'guide' ? 'Describe your experience and specialties...' : 'Describe your transport services...'}
                  value={form.requestMessage} onChange={e => setForm({ ...form, requestMessage: e.target.value })} required />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</> : needsApproval ? 'Submit Request' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-5 text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
