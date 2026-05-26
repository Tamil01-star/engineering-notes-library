import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Mail, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';


const LoginPage = () => {
  const { login, register, loginWithGoogle, error } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLoginTab, setIsLoginTab] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [semester, setSemester] = useState('1');
  const [department, setDepartment] = useState('Computer Science');

  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectPath = searchParams.get('redirect') || '/semesters';

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    const emailLower = email.toLowerCase().trim();
    if (!emailLower.includes('@') || !emailLower.includes('.')) {
      setFormError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      if (isLoginTab) {
        await login(email, password);
      } else {
        await register(name, email, password, Number(semester), department);
      }
      navigate(redirectPath);
    } catch (err) {
      setFormError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMockLogin = async () => {
    setLoading(true);
    setFormError(null);
    try {
      const mockPayload = {
        name: 'Google Student',
        email: 'student@gmail.com',
        googleId: 'g-7890123456',
        imageUrl: ''
      };
      await loginWithGoogle(mockPayload);
      navigate(redirectPath);
    } catch (err) {
      setFormError('Google sign in mock callback failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8 min-h-[calc(100vh-65px)] flex flex-col justify-center relative z-20">
      
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 text-white shadow-xl">
          <BookOpen className="h-6 w-6" />
        </div>
        <h2 className="font-montserrat text-2xl font-black tracking-wider text-white">ENGINEERING LIBRARY</h2>
        <p className="text-xs text-slate-400">Join the collegiate network of academic notes and files.</p>
      </div>

      <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-6">
        
        <div className="flex border-b border-white/5 pb-2">
          <button
            onClick={() => { setIsLoginTab(true); setFormError(null); }}
            className={`flex-1 text-center py-2 text-xs font-bold transition-colors ${
              isLoginTab ? 'text-cyan-400 border-b border-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Google Mail Log In
          </button>
          <button
            onClick={() => { setIsLoginTab(false); setFormError(null); }}
            className={`flex-1 text-center py-2 text-xs font-bold transition-colors ${
              !isLoginTab ? 'text-cyan-400 border-b border-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {(formError || error) && (
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5" />
            <span>{formError || error}</span>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          
          {!isLoginTab && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Samuel Wilson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLoginTab}
                className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> Google Mail ID *
            </label>
            <input
              type="email"
              placeholder="e.g. student@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" /> Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-2 pr-10 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-cyan-400 transition-colors z-10 flex items-center justify-center"
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!isLoginTab && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-2 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="Computer Science">CSE</option>
                  <option value="Electronics & Comm">ECE</option>
                  <option value="Electrical Engineering">EE</option>
                  <option value="Mechanical Engineering">MECH</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-2 text-xs text-slate-300 focus:outline-none"
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:opacity-95 transition-opacity text-xs uppercase tracking-wider pt-3"
          >
            {loading ? 'Processing...' : isLoginTab ? 'Authenticate Gmail' : 'Onboard Gmail Student'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold uppercase text-slate-500 tracking-widest font-mono">OR</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        <button
          onClick={handleGoogleMockLogin}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <span className="h-4 w-4 bg-gradient-to-tr from-red-500 via-blue-500 to-yellow-500 rounded-full inline-block flex-shrink-0"></span>
          <span>Log In with Google SSO (1-Click)</span>
        </button>

      </div>

    </div>
  );
};

export default LoginPage;
