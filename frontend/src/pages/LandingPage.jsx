import React from 'react';
import {
  Sprout,
  MessageSquare,
  Camera,
  FlaskConical,
  CloudSun,
  TrendingUp,
  Landmark,
  FileText,
  CalendarDays,
  Calculator,
  Bug,
  Users,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useMode, useTheme, useAuth } from '../context';
import { LANGUAGES } from '../utils/constants';

const LandingPage = ({ onNavigate }) => {
  const { userMode, setUserMode, appLanguage, setAppLanguage, t } = useMode();
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();

  const highlights = [
    { id: 'chat', icon: MessageSquare, title: t('AI & Voice Assistant', 'AI और आवाज़ सहायक'), desc: t('Ask farming questions in Hindi & regional languages.', 'हिंदी व क्षेत्रीय भाषाओं में बोलकर या लिखकर पूछें।'), color: 'text-emerald-500' },
    { id: 'disease', icon: Camera, title: t('Crop Disease Detection', 'फसल रोग पहचान'), desc: t('Upload or capture leaf photos for instant AI checks.', 'पत्ती की फोटो से रोग और उपचार की सलाह पाएं।'), color: 'text-green-500' },
    { id: 'soil', icon: FlaskConical, title: t('Soil & Fertilizer AI', 'मिट्टी और खाद सलाह'), desc: t('ML-powered NPK & pH analysis with organic fixes.', 'NPK व pH जांच और सही खाद की मात्रा जानें।'), color: 'text-amber-500' },
    { id: 'crop-seed', icon: Sprout, title: t('Crop & Seed Advisor', 'फसल व बीज सलाह'), desc: t('Trained on 2,200+ soil & climate records.', 'मिट्टी और मौसम के अनुसार सर्वोत्तम फसल व बीज।'), color: 'text-lime-500' },
    { id: 'pest', icon: Bug, title: t('Pest Identification', 'कीट पहचान'), desc: t('Identify insects and safe organic control steps.', 'कीट फोटो से पहचान और सुरक्षित रोकथाम जानें।'), color: 'text-rose-500' },
    { id: 'weather', icon: CloudSun, title: t('Weather & Irrigation', 'मौसम और सिंचाई'), desc: t('Live local forecast + smart watering schedule.', 'लाइव मौसम चेतावनी और सिंचाई समय सारणी।'), color: 'text-sky-500' },
    { id: 'mandi', icon: TrendingUp, title: t('Mandi Prices', 'मंडी भाव'), desc: t('Compare nearby market rates & trends.', 'नजदीकी मंडियों के भाव और तुलना देखें।'), color: 'text-orange-500' },
    { id: 'schemes', icon: Landmark, title: t('Schemes & Insurance', 'सरकारी योजनाएं व बीमा'), desc: t('PM-KISAN, PMFBY claims, KCC & official links.', 'पीएम-किसान, फसल बीमा क्लेम व सरकारी लिंक।'), color: 'text-indigo-500' },
    { id: 'pdf', icon: FileText, title: t('PDF Knowledge AI', 'PDF दस्तावेज़ सहायक'), desc: t('Summarize manuals, search & download reports.', 'कृषि PDF का हिंदी सारांश और प्रश्नोत्तर।'), color: 'text-teal-500' },
    { id: 'calendar', icon: CalendarDays, title: t('Crop Calendar', 'फसल कैलेंडर'), desc: t('Sowing to harvest reminders & milestones.', 'बुवाई से कटाई तक चरणबद्ध रिमाइंडर।'), color: 'text-cyan-500' },
    { id: 'calculator', icon: Calculator, title: t('Profit Calculator', 'लागत व मुनाफा गणना'), desc: t('Track expenses, break-even price & net profit.', 'खर्च, बिक्री मूल्य और शुद्ध लाभ का हिसाब।'), color: 'text-emerald-500' },
    { id: 'community', icon: Users, title: t('Farmer Community', 'किसान समुदाय'), desc: t('Share field photos, experiences & solutions.', 'अन्य किसानों से जुड़ें और अनुभव साझा करें।'), color: 'text-purple-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Hero Banner */}
      <section className="glass-card p-6 sm:p-10 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              AgroSathi AI • एग्रोसाथी AI — India&apos;s Smart Krishi Platform
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t(
                'Smart Farming Guidance from Seed to Harvest',
                'बीज से कटाई तक — हर किसान का स्मार्ट डिजिटल साथी'
              )}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {t(
                'Built for both first-time smartphone users (Easy Mode with Voice & Hindi) and agronomy experts (Expert Mode with ML analytics & PDF reports).',
                'सरल मोड (आवाज़ और हिंदी के साथ बड़े बटन) और विशेषज्ञ मोड (विस्तृत रिपोर्ट व डेटा) — दोनों के लिए उपयोगी।'
              )}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm inline-flex items-center gap-2 shadow-lg transition-all"
              >
                {t('Open Farmer Dashboard', 'किसान डैशबोर्ड खोलें')}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('chat')}
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm inline-flex items-center gap-2 transition-all"
              >
                {t('Ask AI / Voice Expert', 'AI / आवाज़ से पूछें')}
              </button>
              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => onNavigate('auth')}
                  className="px-4 py-3 rounded-xl border border-emerald-700/25 dark:border-emerald-400/30 text-slate-800 dark:text-emerald-100 hover:bg-emerald-500/10 text-sm font-medium transition-all"
                >
                  {t('Login / Register', 'लॉगिन / पंजीकरण')}
                </button>
              ) : (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-500/10">
                  {t(`Signed in as ${user?.name}`, `स्वागत है, ${user?.name}`)}
                </span>
              )}
            </div>
          </div>

          {/* Quick Controls Card */}
          <div className="glass-panel rounded-2xl p-5 w-full lg:w-80 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              {t('Personalize Your View', 'अपनी पसंद चुनें')}
            </h3>

            {/* Easy vs Expert Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('Experience Mode', 'उपयोग मोड')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUserMode('easy')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    userMode === 'easy'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  🌾 {t('Easy Mode', 'सरल मोड')}
                </button>
                <button
                  type="button"
                  onClick={() => setUserMode('expert')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    userMode === 'expert'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  📊 {t('Expert Mode', 'विशेषज्ञ मोड')}
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('Preferred Language', 'पसंदीदा भाषा')}
              </label>
              <select
                value={appLanguage}
                onChange={(e) => setAppLanguage(e.target.value)}
                className="input-field"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full py-2 px-3 rounded-xl border border-emerald-700/20 dark:border-emerald-500/25 flex items-center justify-between text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-emerald-500/10"
            >
              <span>{isDark ? t('Dark Mode Active', 'डार्क मोड चालू') : t('Light Mode Active', 'लाइट मोड चालू')}</span>
              {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('All-in-One Farming Services', 'सभी कृषि सेवाएं एक ही जगह')}
          </h2>
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {t('Tap any card to launch', 'खोलने के लिए किसी भी कार्ड पर क्लिक करें')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className="glass-card p-5 text-left hover:scale-[1.01] hover:border-emerald-500/50 transition-all group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0">
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
