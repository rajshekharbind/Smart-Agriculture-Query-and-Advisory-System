import React, { useEffect, useState } from 'react';
import {
  Sprout,
  Home,
  LayoutDashboard,
  MessageSquare,
  Camera,
  FlaskConical,
  Bug,
  CloudSun,
  TrendingUp,
  Landmark,
  FileText,
  CalendarDays,
  Calculator,
  Leaf,
  Users,
  Bell,
  User,
  ShieldCheck,
  Menu,
  X,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  LogIn,
} from 'lucide-react';
import {
  AuthProvider,
  ChatProvider,
  DocumentProvider,
  ModeProvider,
  ThemeProvider,
  useAuth,
  useMode,
  useTheme,
} from './context';
import {
  AdminDashboardPage,
  AuthPage,
  ChatPage,
  CommunityPage,
  CropCalendarPage,
  CropSeedRecommendPage,
  DiseasePredictionPage,
  FarmerDashboardPage,
  GuidesPage,
  LandingPage,
  MandiPricesPage,
  NotificationsProfilePage,
  PdfAssistantPage,
  PestIdentificationPage,
  ProfitCalculatorPage,
  SchemesInsurancePage,
  SoilAnalysisPage,
  WeatherIrrigationPage,
} from './pages';
import { checkBackendHealth } from './services/api';
import { LANGUAGES } from './utils/constants';

function AppShell() {
  const [activePage, setActivePage] = useState('landing');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [health, setHealth] = useState({ online: false, rag_enabled: false });

  const { isDark, toggleTheme } = useTheme();
  const { userMode, setUserMode, appLanguage, setAppLanguage, t } = useMode();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      const s = await checkBackendHealth();
      if (mounted) setHealth(s);
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const navItems = [
    { id: 'landing', icon: Home, label: t('Home', 'होम') },
    { id: 'dashboard', icon: LayoutDashboard, label: t('Farmer Dashboard', 'किसान डैशबोर्ड') },
    { id: 'chat', icon: MessageSquare, label: t('AI & Voice Chat', 'AI व आवाज़ चैट') },
    { id: 'disease', icon: Camera, label: t('Disease Detection', 'रोग पहचान') },
    { id: 'soil', icon: FlaskConical, label: t('Soil & NPK', 'मिट्टी जांच') },
    { id: 'crop-seed', icon: Sprout, label: t('Crop & Seed AI', 'फसल व बीज') },
    { id: 'pest', icon: Bug, label: t('Pest Detection', 'कीट पहचान') },
    { id: 'weather', icon: CloudSun, label: t('Weather & Irrigation', 'मौसम व सिंचाई') },
    { id: 'mandi', icon: TrendingUp, label: t('Mandi Prices', 'मंडी भाव') },
    { id: 'schemes', icon: Landmark, label: t('Schemes & Insurance', 'योजना व बीमा') },
    { id: 'pdf', icon: FileText, label: t('PDF Knowledge AI', 'PDF सहायक') },
    { id: 'calendar', icon: CalendarDays, label: t('Crop Calendar', 'फसल कैलेंडर') },
    { id: 'calculator', icon: Calculator, label: t('Profit Calculator', 'मुनाफा हिसाब') },
    { id: 'guides', icon: Leaf, label: t('Organic & Equipment', 'जैविक व यंत्र') },
    { id: 'community', icon: Users, label: t('Community', 'किसान समुदाय') },
    { id: 'notifications', icon: Bell, label: t('Alerts & Reminders', 'सूचनाएं') },
    { id: 'profile', icon: User, label: t('Farmer Profile', 'प्रोफ़ाइल') },
    { id: 'admin', icon: ShieldCheck, label: t('Admin & Models', 'एडमिन') },
  ];

  const navigate = (pageId) => {
    setActivePage(pageId);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (activePage) {
      case 'landing':
        return <LandingPage onNavigate={navigate} />;
      case 'auth':
        return <AuthPage onSuccess={() => navigate('dashboard')} />;
      case 'dashboard':
        return <FarmerDashboardPage onNavigate={navigate} />;
      case 'chat':
        return <ChatPage />;
      case 'disease':
        return <DiseasePredictionPage onNavigateToChat={() => navigate('chat')} />;
      case 'soil':
        return <SoilAnalysisPage />;
      case 'crop-seed':
        return <CropSeedRecommendPage />;
      case 'pest':
        return <PestIdentificationPage />;
      case 'weather':
        return <WeatherIrrigationPage />;
      case 'mandi':
        return <MandiPricesPage />;
      case 'schemes':
        return <SchemesInsurancePage />;
      case 'pdf':
        return <PdfAssistantPage />;
      case 'calendar':
        return <CropCalendarPage />;
      case 'calculator':
        return <ProfitCalculatorPage />;
      case 'guides':
        return <GuidesPage />;
      case 'community':
        return <CommunityPage />;
      case 'notifications':
        return <NotificationsProfilePage defaultSection="notifications" onNavigateAuth={() => navigate('auth')} />;
      case 'profile':
        return <NotificationsProfilePage defaultSection="profile" onNavigateAuth={() => navigate('auth')} />;
      case 'admin':
        return <AdminDashboardPage />;
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="agri-bg-shell flex flex-col min-h-screen text-slate-900 dark:text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-emerald-700/15 dark:border-emerald-500/20 bg-white/85 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => navigate('landing')}
              className="flex items-center gap-2.5 text-left min-w-0"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                <Sprout className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-base sm:text-lg tracking-tight block truncate">
                  AgroSathi AI <span className="text-emerald-600 dark:text-emerald-300 font-semibold text-sm hidden sm:inline">• एग्रोसाथी AI</span>
                </span>
              </div>
            </button>
          </div>

          {/* Right Global Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            {/* Easy / Expert Switch */}
            <div className="hidden sm:flex rounded-xl border border-emerald-700/20 dark:border-emerald-500/25 overflow-hidden text-xs font-semibold">
              <button
                type="button"
                onClick={() => setUserMode('easy')}
                className={`px-2.5 py-1.5 ${
                  userMode === 'easy'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/70 dark:bg-slate-900/70'
                }`}
              >
                Easy
              </button>
              <button
                type="button"
                onClick={() => setUserMode('expert')}
                className={`px-2.5 py-1.5 ${
                  userMode === 'expert'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/70 dark:bg-slate-900/70'
                }`}
              >
                Expert
              </button>
            </div>

            {/* Language Picker */}
            <select
              value={appLanguage}
              onChange={(e) => setAppLanguage(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-emerald-700/20 dark:border-emerald-500/25 bg-white dark:bg-slate-900"
              aria-label="Language"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            {/* Dark/Light Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-emerald-700/20 dark:border-emerald-500/25 bg-white/70 dark:bg-slate-900/70 hover:bg-emerald-500/10"
              title="Toggle Dark / Light Mode"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Health Badge */}
            <span
              className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                health.online
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
              }`}
            >
              {health.online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {health.online ? 'Online' : 'Offline'}
            </span>

            {/* Auth Button */}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('profile')}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/25 text-xs font-semibold truncate max-w-[110px]"
              >
                {user?.name}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('auth')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout with Persistent Desktop Sidebar + Mobile Drawer */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-60 flex-col border-r border-emerald-700/15 dark:border-emerald-500/20 bg-white/75 dark:bg-slate-950/65 backdrop-blur-md p-3 gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-emerald-500/10'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Mobile Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex bg-black/60 backdrop-blur-sm">
            <div className="w-72 max-w-[85vw] h-full bg-white dark:bg-slate-950 border-r border-emerald-500/25 p-4 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-base">AgroSathi AI Menu</span>
                <button type="button" onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setUserMode('easy')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${userMode === 'easy' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                  Easy Mode
                </button>
                <button
                  type="button"
                  onClick={() => setUserMode('expert')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${userMode === 'expert' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                  Expert Mode
                </button>
              </div>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left ${
                        active ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-500/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Active Page Content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ModeProvider>
        <AuthProvider>
          <ChatProvider>
            <DocumentProvider>
              <AppShell />
            </DocumentProvider>
          </ChatProvider>
        </AuthProvider>
      </ModeProvider>
    </ThemeProvider>
  );
}

export default App;
