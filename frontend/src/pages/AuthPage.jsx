import React, { useState } from 'react';
import { LogIn, UserPlus, Sprout } from 'lucide-react';
import { Card, Button, Alert } from '../components';
import { useAuth, useMode } from '../context';
import { INDIAN_STATES, LANGUAGES } from '../utils/constants';

const AuthPage = ({ onSuccess }) => {
  const { login, register, authLoading } = useAuth();
  const { t } = useMode();

  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    state: 'Kerala',
    district: 'Thrissur',
    preferred_language: 'Hindi',
    ui_mode: 'easy',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.email, form.password);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <Card>
        <Card.Header className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto">
            <Sprout className="w-6 h-6" />
          </div>
          <Card.Title>
            {isRegister
              ? t('Create Farmer Account', 'किसान खाता बनाएं')
              : t('Sign In to AgroSathi AI', 'AgroSathi AI में लॉगिन करें')}
          </Card.Title>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t(
              'Save your farm profile, crop calendars, profit records, and community posts.',
              'अपनी खेती प्रोफ़ाइल, फसल कैलेंडर और हिसाब सुरक्षित रखें।'
            )}
          </p>
        </Card.Header>

        <Card.Content className="space-y-4">
          {error && (
            <Alert type="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-medium mb-1">Full Name</label>
                  <input
                    required
                    className="input-field"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Phone</label>
                    <input
                      className="input-field"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Language</label>
                    <select
                      className="input-field"
                      value={form.preferred_language}
                      onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">State</label>
                    <select
                      className="input-field"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">District</label>
                    <input
                      className="input-field"
                      value={form.district}
                      onChange={(e) => setForm({ ...form, district: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium mb-1">Email</label>
              <input
                type="email"
                required
                className="input-field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="farmer@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="input-field"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
            </div>

            <Button type="submit" loading={authLoading} className="w-full">
              {isRegister ? (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('Register Account', 'पंजीकरण करें')}
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  {t('Sign In', 'लॉगिन करें')}
                </>
              )}
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline"
            >
              {isRegister
                ? t('Already have an account? Sign In', 'पहले से खाता है? लॉगिन करें')
                : t('New farmer? Create an account', 'नए किसान हैं? खाता बनाएं')}
            </button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default AuthPage;
