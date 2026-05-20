import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return toast.error('Email is required');
    if (!form.password) return toast.error('Password is required');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', form);
      login(data.user); // Token is now in httpOnly cookie
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      const errorCode = err.response?.data?.code;
      
      if (errorCode === 'AUTH_003') {
        toast.error('Invalid email or password');
      } else if (errorCode === 'AUTH_006') {
        toast.error('Your account is pending admin approval');
      } else {
        toast.error(errorMessage);
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 relative">
        <img src="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200"
          alt="Bahir Dar" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 to-primary-600/60 flex flex-col justify-end p-12">
          <h2 className="text-4xl font-bold text-white mb-3">Welcome Back</h2>
          <p className="text-white/80 text-lg">Discover the beauty of Bahir Dar — Lake Tana, Blue Nile Falls, and ancient monasteries await.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md animate-slide-up">
          <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-xl mb-10 hover:text-primary-700 transition-colors">
            🌍 Visit Bahir Dar
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
          <p className="text-gray-400 mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input className="input" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input className="input pr-12" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-sm">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
