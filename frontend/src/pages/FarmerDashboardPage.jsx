import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Camera,
  FlaskConical,
  Sprout,
  Bug,
  CloudSun,
  Droplets,
  TrendingUp,
  Landmark,
  FileText,
  CalendarDays,
  Calculator,
  Leaf,
  Wrench,
  Users,
  Bell,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Card, SpeakButton } from '../components';
import { useAuth, useMode } from '../context';
import { agriService } from '../services';

const FarmerDashboardPage = ({ onNavigate }) => {
  const { user, profile } = useAuth();
  const { isEasy, appLanguage, t } = useMode();
  const [weather, setWeather] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loc = profile?.district || 'Thrissur';
    agriService.getWeather(loc).then(setWeather).catch(() => {});
    agriService.getNotifications().then((d) => setNotifications(d.notifications || [])).catch(() => {});
  }, [profile?.district]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const modules = [
    { id: 'chat', icon: MessageSquare, label: t('AI & Voice Chat', 'AI व आवाज़ चैट'), bg: 'from-emerald-500 to-green-600' },
    { id: 'disease', icon: Camera, label: t('Crop Disease Check', 'फसल रोग जांच'), bg: 'from-green-500 to-teal-600' },
    { id: 'soil', icon: FlaskConical, label: t('Soil Health & NPK', 'मिट्टी व खाद जांच'), bg: 'from-amber-500 to-orange-600' },
    { id: 'crop-seed', icon: Sprout, label: t('Crop & Seed Guide', 'फसल व बीज सलाह'), bg: 'from-lime-500 to-emerald-600' },
    { id: 'pest', icon: Bug, label: t('Pest Detection', 'कीट पहचान'), bg: 'from-rose-500 to-red-600' },
    { id: 'weather', icon: CloudSun, label: t('Weather & Irrigation', 'मौसम व सिंचाई'), bg: 'from-sky-500 to-blue-600' },
    { id: 'mandi', icon: TrendingUp, label: t('Mandi Prices', 'मंडी भाव'), bg: 'from-orange-500 to-amber-600' },
    { id: 'schemes', icon: Landmark, label: t('Schemes & Insurance', 'योजनाएं व बीमा'), bg: 'from-indigo-500 to-blue-600' },
    { id: 'pdf', icon: FileText, label: t('PDF & Docs AI', 'PDF दस्तावेज़ AI'), bg: 'from-teal-500 to-cyan-600' },
    { id: 'calendar', icon: CalendarDays, label: t('Crop Calendar', 'फसल कैलेंडर'), bg: 'from-cyan-500 to-sky-600' },
    { id: 'calculator', icon: Calculator, label: t('Profit Calculator', 'मुनाफा कैलकुलेटर'), bg: 'from-emerald-600 to-teal-700' },
    { id: 'guides', icon: Leaf, label: t('Organic & Equipment', 'जैविक खेती व यंत्र'), bg: 'from-green-600 to-lime-700' },
    { id: 'community', icon: Users, label: t('Farmer Community', 'किसान समुदाय'), bg: 'from-purple-500 to-indigo-600' },
    { id: 'notifications', icon: Bell, label: t(`Alerts (${unreadCount})`, `सूचनाएं (${unreadCount})`), bg: 'from-amber-600 to-rose-600' },
    { id: 'profile', icon: User, label: t('Farmer Profile', 'मेरी प्रोफ़ाइल'), bg: 'from-slate-600 to-slate-700' },
    { id: 'admin', icon: ShieldCheck, label: t('Admin & ML Stats', 'एडमिन व मॉडल'), bg: 'from-violet-600 to-purple-700' },
  ];

  const welcomeVoiceText = isEasy
    ? `नमस्ते ${user?.name || 'किसान भाई'}। एग्रोसाथी में आपका स्वागत है। नीचे दिए गए बड़े बटन दबाकर अपनी फसल, मिट्टी, मौसम या मंडी भाव की जानकारी लें।`
    : `Welcome ${user?.name || 'Farmer'}. Your farm dashboard is active in Expert Mode.`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Greeting & Quick Weather Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 mb-2">
                {isEasy ? t('Easy Mode • Simple Touch Navigation', 'सरल मोड • आसान बड़े बटन') : t('Expert Mode • Full Analytics', 'विशेषज्ञ मोड • विस्तृत डेटा')}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t(`Welcome, ${user?.name || 'Farmer'}`, `नमस्ते, ${user?.name || 'किसान साथी'}`)}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {profile?.district
                  ? `${profile.district}, ${profile.state} • ${profile.farm_size_acres || 2} Acres (${profile.soil_type || 'Loamy'})`
                  : t('Choose any farming service below to begin.', 'नीचे दी गई किसी भी कृषि सेवा को चुनें।')}
              </p>
            </div>
            <SpeakButton text={welcomeVoiceText} language={appLanguage} label={t('Listen Guide', 'सुनें')} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('chat')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium inline-flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              {t('Ask AI Expert Now', 'AI विशेषज्ञ से पूछें')}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('disease')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold inline-flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {t('Scan Leaf Photo', 'पत्ती की फोटो जांचें')}
            </button>
          </div>
        </Card>

        {/* Live Weather Snapshot */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CloudSun className="w-5 h-5 text-sky-500" />
              {t('Live Farm Weather', 'लाइव मौसम')}
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('weather')}
              className="text-xs text-emerald-600 dark:text-emerald-300 hover:underline"
            >
              {t('Full Forecast →', 'पूरा मौसम →')}
            </button>
          </div>
          {weather?.is_live ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {weather.current.temperature_c}°C
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[160px]">
                  {weather.location}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-sky-500" />
                  {weather.current.humidity}% RH
                </span>
                <span>Wind: {weather.current.wind_kmh} km/h</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                {weather.farming_alerts?.[0]}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-4">
              {t('Loading live weather...', 'मौसम लोड हो रहा है...')}
            </p>
          )}
        </Card>
      </div>

      {/* Navigation Modules Grid (Larger tiles in Easy Mode, sleek grid in Expert Mode) */}
      <div
        className={`grid gap-3 sm:gap-4 ${
          isEasy
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6'
        }`}
      >
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => onNavigate(mod.id)}
              className={`glass-card text-left hover:scale-[1.02] hover:border-emerald-500/50 transition-all flex flex-col justify-between ${
                isEasy ? 'p-5 min-h-[120px]' : 'p-4 min-h-[96px]'
              }`}
            >
              <div
                className={`rounded-xl bg-gradient-to-br ${mod.bg} text-white flex items-center justify-center shadow-sm ${
                  isEasy ? 'w-12 h-12 mb-3' : 'w-9 h-9 mb-2'
                }`}
              >
                <Icon className={isEasy ? 'w-6 h-6' : 'w-4 h-4'} />
              </div>
              <span
                className={`font-bold text-slate-900 dark:text-white leading-snug ${
                  isEasy ? 'text-base' : 'text-xs sm:text-sm'
                }`}
              >
                {mod.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Farming Reminders */}
      {notifications.length > 0 && (
        <Card>
          <Card.Header className="flex items-center justify-between">
            <Card.Title className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-500" />
              {t('Recent Farming Alerts & Reminders', 'ताज़ा कृषि सूचनाएं')}
            </Card.Title>
            <button
              type="button"
              onClick={() => onNavigate('notifications')}
              className="text-xs text-emerald-600 dark:text-emerald-300 hover:underline"
            >
              {t('View All', 'सभी देखें')}
            </button>
          </Card.Header>
          <Card.Content className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {notifications.slice(0, 3).map((n) => (
              <div
                key={n.id}
                className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/50 border border-emerald-700/10 dark:border-emerald-500/15 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate">
                    {n.title}
                  </span>
                  {n.due_date && <span className="text-[11px] text-slate-500">{n.due_date}</span>}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {n.message}
                </p>
              </div>
            ))}
          </Card.Content>
        </Card>
      )}
    </div>
  );
};

export default FarmerDashboardPage;
