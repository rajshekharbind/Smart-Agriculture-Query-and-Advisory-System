import React, { useEffect, useState } from 'react';
import { Bell, User, Check } from 'lucide-react';
import { Card, Button, Alert } from '../components';
import { agriService } from '../services';
import { useAuth, useMode } from '../context';
import { INDIAN_STATES, LANGUAGES, SOIL_TYPES } from '../utils/constants';

const NotificationsProfilePage = ({ defaultSection = 'notifications', onNavigateAuth }) => {
  const { user, profile, isAuthenticated, updateProfile, logout } = useAuth();
  const { setAppLanguage, setUserMode, t } = useMode();

  const [notifications, setNotifications] = useState([]);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', category: 'irrigation', due_date: '' });

  const [profForm, setProfForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    state: profile?.state || 'Kerala',
    district: profile?.district || 'Thrissur',
    village: profile?.village || '',
    farm_size_acres: profile?.farm_size_acres || 2,
    soil_type: profile?.soil_type || 'Loamy',
    primary_crops: profile?.primary_crops || 'Rice, Coconut',
    preferred_language: profile?.preferred_language || 'Hindi',
    ui_mode: profile?.ui_mode || 'easy',
  });
  const [savedMsg, setSavedMsg] = useState(null);

  useEffect(() => {
    setProfForm({
      name: user?.name || '',
      phone: user?.phone || '',
      state: profile?.state || 'Kerala',
      district: profile?.district || 'Thrissur',
      village: profile?.village || '',
      farm_size_acres: profile?.farm_size_acres || 2,
      soil_type: profile?.soil_type || 'Loamy',
      primary_crops: profile?.primary_crops || 'Rice, Coconut',
      preferred_language: profile?.preferred_language || 'Hindi',
      ui_mode: profile?.ui_mode || 'easy',
    });
  }, [user, profile]);

  const loadNotifs = async () => {
    const res = await agriService.getNotifications();
    setNotifications(res.notifications || []);
  };

  useEffect(() => {
    loadNotifs().catch(() => {});
  }, []);

  const handleAddNotif = async (e) => {
    e.preventDefault();
    await agriService.createNotification(notifForm);
    setNotifForm({ title: '', message: '', category: 'irrigation', due_date: '' });
    await loadNotifs();
  };

  const handleMarkRead = async (id) => {
    await agriService.markNotificationRead(id);
    await loadNotifs();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavedMsg(null);
    await updateProfile(profForm);
    setAppLanguage(profForm.preferred_language);
    setUserMode(profForm.ui_mode);
    setSavedMsg('Farmer profile updated successfully!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card className={defaultSection === 'notifications' ? 'ring-2 ring-emerald-500/30' : ''}>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              {t('Farming Reminders & Notifications', 'खेती रिमाइंडर और सूचनाएं')}
            </Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <form onSubmit={handleAddNotif} className="space-y-2.5 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/60">
              <input required className="input-field" placeholder="Reminder title (e.g., Urea Top Dressing)" value={notifForm.title} onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })} />
              <input required className="input-field" placeholder="Details..." value={notifForm.message} onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })} />
              <div className="flex gap-2">
                <input type="date" className="input-field flex-1" value={notifForm.due_date} onChange={(e) => setNotifForm({ ...notifForm, due_date: e.target.value })} />
                <Button type="submit" size="sm">Add Reminder</Button>
              </div>
            </form>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-2 ${
                    n.is_read
                      ? 'bg-slate-100/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 opacity-70'
                      : 'bg-emerald-500/10 border-emerald-500/25'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">{n.title} {n.due_date && `• ${n.due_date}`}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{n.message}</p>
                  </div>
                  {!n.is_read && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1.5 rounded-lg bg-emerald-600 text-white"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>

        {/* Farmer Profile */}
        <Card className={defaultSection === 'profile' ? 'ring-2 ring-emerald-500/30' : ''}>
          <Card.Header className="flex items-center justify-between">
            <Card.Title className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" />
              {t('Farmer Profile & Farm Details', 'किसान प्रोफ़ाइल')}
            </Card.Title>
            {isAuthenticated && (
              <Button size="sm" variant="outline" onClick={logout}>Logout</Button>
            )}
          </Card.Header>
          <Card.Content>
            {!isAuthenticated ? (
              <div className="text-center py-10 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Sign in or register to save your personal farm profile, soil type, and crop history.
                </p>
                <Button onClick={onNavigateAuth}>Login / Register</Button>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                {savedMsg && <Alert type="success">{savedMsg}</Alert>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Full Name</label>
                    <input className="input-field" value={profForm.name} onChange={(e) => setProfForm({ ...profForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Phone</label>
                    <input className="input-field" value={profForm.phone} onChange={(e) => setProfForm({ ...profForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">State</label>
                    <select className="input-field" value={profForm.state} onChange={(e) => setProfForm({ ...profForm, state: e.target.value })}>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">District</label>
                    <input className="input-field" value={profForm.district} onChange={(e) => setProfForm({ ...profForm, district: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Village</label>
                    <input className="input-field" value={profForm.village} onChange={(e) => setProfForm({ ...profForm, village: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Farm Size (Acres)</label>
                    <input type="number" step="0.1" className="input-field" value={profForm.farm_size_acres} onChange={(e) => setProfForm({ ...profForm, farm_size_acres: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Soil Type</label>
                    <select className="input-field" value={profForm.soil_type} onChange={(e) => setProfForm({ ...profForm, soil_type: e.target.value })}>
                      {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Preferred Language</label>
                    <select className="input-field" value={profForm.preferred_language} onChange={(e) => setProfForm({ ...profForm, preferred_language: e.target.value })}>
                      {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Primary Crops</label>
                  <input className="input-field" value={profForm.primary_crops} onChange={(e) => setProfForm({ ...profForm, primary_crops: e.target.value })} />
                </div>
                <Button type="submit" className="w-full">Save Profile</Button>
              </form>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default NotificationsProfilePage;
