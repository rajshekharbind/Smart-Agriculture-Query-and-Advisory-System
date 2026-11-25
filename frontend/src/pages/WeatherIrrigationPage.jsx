import React, { useEffect, useState } from 'react';
import { CloudSun, Droplets, Wind, Search, Download } from 'lucide-react';
import { Card, Button, Alert, SpeakButton } from '../components';
import { agriService } from '../services';
import { useAuth, useMode } from '../context';
import { SOIL_TYPES } from '../utils/constants';

const WeatherIrrigationPage = () => {
  const { profile } = useAuth();
  const { appLanguage, t } = useMode();

  const [location, setLocation] = useState(profile?.district || 'Thrissur');
  const [weather, setWeather] = useState(null);
  const [wLoading, setWLoading] = useState(false);

  const [irrForm, setIrrForm] = useState({
    crop: 'Paddy',
    growth_stage: 'Vegetative',
    soil_type: profile?.soil_type || 'Loamy',
    area_acres: profile?.farm_size_acres || 2,
    temperature_c: 30,
    rain_expected_mm: 0,
  });
  const [irrPlan, setIrrPlan] = useState(null);
  const [irrLoading, setIrrLoading] = useState(false);

  const fetchWeather = async (loc = location) => {
    setWLoading(true);
    try {
      const data = await agriService.getWeather(loc);
      setWeather(data);
      if (data?.is_live) {
        setIrrForm((prev) => ({
          ...prev,
          temperature_c: data.current.temperature_c,
          rain_expected_mm: data.forecast?.[0]?.rain_mm || 0,
        }));
      }
    } finally {
      setWLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(profile?.district || 'Thrissur');
  }, []);

  const handlePlan = async (e) => {
    e.preventDefault();
    setIrrLoading(true);
    try {
      const data = await agriService.planIrrigation({ ...irrForm, language: appLanguage });
      setIrrPlan(data);
    } finally {
      setIrrLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CloudSun className="w-6 h-6 text-sky-500" />
            {t('Weather Assistant & Irrigation Planner', 'मौसम सहायक और सिंचाई योजना')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {t('Real-time Open-Meteo weather forecast with automated crop watering schedules.', 'लाइव मौसम पूर्वानुमान और फसल अवस्था के अनुसार सिंचाई सलाह।')}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchWeather(location);
          }}
          className="flex gap-2"
        >
          <input
            className="input-field w-48 sm:w-56"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or District..."
          />
          <Button type="submit" loading={wLoading}>
            <Search className="w-4 h-4 mr-1" />
            Check
          </Button>
        </form>
      </div>

      {/* Weather Card */}
      {weather?.is_live ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <p className="text-xs text-slate-500 uppercase">Location</p>
              <p className="text-base font-bold mt-1">{weather.location}</p>
              <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                {weather.source}
              </span>
            </Card>
            <Card>
              <p className="text-xs text-slate-500 uppercase">Temperature</p>
              <p className="text-3xl font-extrabold mt-1">{weather.current.temperature_c}°C</p>
            </Card>
            <Card>
              <p className="text-xs text-slate-500 uppercase flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-sky-500" /> Humidity & Rain
              </p>
              <p className="text-2xl font-bold mt-1">{weather.current.humidity}% RH</p>
              <p className="text-xs text-slate-500">Current Precip: {weather.current.precipitation_mm} mm</p>
            </Card>
            <Card>
              <p className="text-xs text-slate-500 uppercase flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-teal-500" /> Wind Speed
              </p>
              <p className="text-2xl font-bold mt-1">{weather.current.wind_kmh} km/h</p>
            </Card>
          </div>

          <div className="space-y-2">
            {weather.farming_alerts?.map((a, idx) => (
              <Alert key={idx} type="warning">{a}</Alert>
            ))}
          </div>

          <Card>
            <Card.Header>
              <Card.Title>{t('5-Day Farm Forecast', '5-दिन का मौसम पूर्वानुमान')}</Card.Title>
            </Card.Header>
            <Card.Content className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {weather.forecast?.map((d) => (
                <div
                  key={d.date}
                  className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center space-y-1"
                >
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{d.date}</p>
                  <p className="text-sm font-bold">{d.temp_max}° / {d.temp_min}°C</p>
                  <p className="text-xs text-sky-600 dark:text-sky-300">Rain: {d.rain_mm} mm ({d.rain_prob}%)</p>
                </div>
              ))}
            </Card.Content>
          </Card>
        </div>
      ) : (
        weather?.error && <Alert type="warning">{weather.error}</Alert>
      )}

      {/* Irrigation Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{t('Irrigation Schedule Planner', 'सिंचाई योजना बनाएं')}</Card.Title>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handlePlan} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Crop</label>
                  <input className="input-field" value={irrForm.crop} onChange={(e) => setIrrForm({ ...irrForm, crop: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Growth Stage</label>
                  <select className="input-field" value={irrForm.growth_stage} onChange={(e) => setIrrForm({ ...irrForm, growth_stage: e.target.value })}>
                    <option>Germination</option>
                    <option>Vegetative</option>
                    <option>Flowering</option>
                    <option>Grain Filling / Fruiting</option>
                    <option>Maturity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Soil Type</label>
                  <select className="input-field" value={irrForm.soil_type} onChange={(e) => setIrrForm({ ...irrForm, soil_type: e.target.value })}>
                    {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Area (Acres)</label>
                  <input type="number" step="0.1" className="input-field" value={irrForm.area_acres} onChange={(e) => setIrrForm({ ...irrForm, area_acres: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Temp (°C)</label>
                  <input type="number" step="0.1" className="input-field" value={irrForm.temperature_c} onChange={(e) => setIrrForm({ ...irrForm, temperature_c: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Expected Rain (mm)</label>
                  <input type="number" step="0.1" className="input-field" value={irrForm.rain_expected_mm} onChange={(e) => setIrrForm({ ...irrForm, rain_expected_mm: Number(e.target.value) })} />
                </div>
              </div>
              <Button type="submit" loading={irrLoading} className="w-full">
                {t('Calculate Irrigation Schedule', 'सिंचाई समय सारणी निकालें')}
              </Button>
            </form>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex items-center justify-between">
            <Card.Title>{t('Water Requirement & Schedule', 'पानी की मात्रा और समय')}</Card.Title>
            {irrPlan && (
              <div className="flex gap-2">
                <SpeakButton text={`${irrPlan.recommendation}. ${irrPlan.ai_tips || ''}`} language={appLanguage} />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    agriService.downloadPdfReport('AgroSathi AI — Irrigation Plan', [
                      {
                        heading: 'Schedule',
                        body: `Crop: ${irrPlan.crop} (${irrPlan.growth_stage})\nInterval: Every ${irrPlan.interval_days} days\nDaily Water: ${irrPlan.liters_per_day_total} L\n${irrPlan.recommendation}`,
                      },
                      { heading: 'Tips', body: irrPlan.ai_tips || '' },
                    ])
                  }
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> PDF
                </Button>
              </div>
            )}
          </Card.Header>
          <Card.Content>
            {irrPlan ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-sky-500/15 border border-sky-500/30">
                    <p className="text-xs text-sky-700 dark:text-sky-300">Interval</p>
                    <p className="text-xl font-bold">Every {irrPlan.interval_days} days</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Water Needed / Day</p>
                    <p className="text-xl font-bold">{irrPlan.liters_per_day_total.toLocaleString()} L</p>
                  </div>
                </div>
                <Alert type="info">{irrPlan.recommendation}</Alert>
                {irrPlan.ai_tips && (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 text-xs sm:text-sm whitespace-pre-wrap">
                    {irrPlan.ai_tips}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-10 text-center">
                {t('Fill crop and soil details to compute your irrigation plan.', 'सिंचाई योजना देखने के लिए विवरण भरें।')}
              </p>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default WeatherIrrigationPage;
