import React, { useState } from 'react';
import { Sprout, Download } from 'lucide-react';
import { Card, Button, Alert, SpeakButton } from '../components';
import { agriService } from '../services';
import { useMode } from '../context';
import { INDIAN_STATES, SEASONS, SOIL_TYPES } from '../utils/constants';

const CropSeedRecommendPage = () => {
  const { appLanguage, t } = useMode();

  const [cropForm, setCropForm] = useState({
    n: 85,
    p: 45,
    k: 42,
    temperature: 26,
    humidity: 80,
    ph: 6.5,
    rainfall: 195,
  });
  const [cropResult, setCropResult] = useState(null);
  const [cropLoading, setCropLoading] = useState(false);

  const [seedForm, setSeedForm] = useState({
    crop: 'rice',
    soil_type: 'Loamy',
    season: 'Kharif',
    water_availability: 'High',
    state: 'Kerala',
  });
  const [seedResult, setSeedResult] = useState(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCropRecommend = async (e) => {
    e.preventDefault();
    setCropLoading(true);
    setError(null);
    try {
      const data = await agriService.recommendCrop({ ...cropForm, language: appLanguage });
      setCropResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setCropLoading(false);
    }
  };

  const handleSeedRecommend = async (e) => {
    e.preventDefault();
    setSeedLoading(true);
    setError(null);
    try {
      const data = await agriService.recommendSeed({ ...seedForm, language: appLanguage });
      setSeedResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sprout className="w-6 h-6 text-emerald-500" />
          {t('Crop & Seed Recommendation (ML + ICAR Guide)', 'फसल और बीज सलाह')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {t(
            'Predict best-suited crops using our RandomForest ML model (2,200 training records) and find certified seed varieties.',
            'मिट्टी, तापमान और वर्षा के अनुसार सबसे उपयुक्त फसल और प्रमाणित बीज चुनें।'
          )}
        </p>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Crop Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{t('1. Crop Recommendation (ML)', '1. फसल सिफारिश (ML मॉडल)')}</Card.Title>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleCropRecommend} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ['n', 'Nitrogen (N)'],
                  ['p', 'Phosphorus (P)'],
                  ['k', 'Potassium (K)'],
                  ['temperature', 'Temp (°C)'],
                  ['humidity', 'Humidity (%)'],
                  ['ph', 'Soil pH'],
                  ['rainfall', 'Rainfall (mm)'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1">{label}</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field"
                      value={cropForm[key]}
                      onChange={(e) => setCropForm({ ...cropForm, [key]: Number(e.target.value) })}
                    />
                  </div>
                ))}
              </div>
              <Button type="submit" loading={cropLoading} className="w-full">
                {t('Recommend Best Crops', 'सर्वोत्तम फसल बताएं')}
              </Button>
            </form>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex items-center justify-between">
            <Card.Title>{t('Recommended Crops', 'सुझाई गई फसलें')}</Card.Title>
            {cropResult && (
              <div className="flex items-center gap-2">
                <SpeakButton
                  text={`Recommended crop is ${cropResult.recommended_crop}. ${cropResult.ai_guidance || ''}`}
                  language={appLanguage}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    agriService.downloadPdfReport('AgroSathi AI — Crop Recommendation', [
                      {
                        heading: 'Best Crop',
                        body: `Top Crop: ${cropResult.recommended_crop}\nModel: ${cropResult.model_info}`,
                      },
                      { heading: 'Guidance', body: cropResult.ai_guidance || '' },
                    ])
                  }
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> PDF
                </Button>
              </div>
            )}
          </Card.Header>
          <Card.Content>
            {cropResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                  <span className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">
                    Top Predicted Crop
                  </span>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white capitalize mt-0.5">
                    {cropResult.recommended_crop}
                  </p>
                </div>

                <div className="space-y-2">
                  {cropResult.top_recommendations?.map((item) => (
                    <div key={item.crop} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="capitalize">{item.crop}</span>
                        <span>{item.confidence}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, item.confidence)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {cropResult.ai_guidance && (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 text-xs sm:text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {cropResult.ai_guidance}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-10 text-center">
                {t('Enter soil and climate parameters to get ML crop predictions.', 'फसल सिफारिश देखने के लिए विवरण भरें।')}
              </p>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Seed Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{t('2. Seed Variety Recommendation', '2. प्रमाणित बीज सलाह')}</Card.Title>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleSeedRecommend} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Crop</label>
                  <input
                    className="input-field"
                    value={seedForm.crop}
                    onChange={(e) => setSeedForm({ ...seedForm, crop: e.target.value })}
                    placeholder="rice, maize, chickpea, banana..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Season</label>
                  <select
                    className="input-field"
                    value={seedForm.season}
                    onChange={(e) => setSeedForm({ ...seedForm, season: e.target.value })}
                  >
                    {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Soil Type</label>
                  <select
                    className="input-field"
                    value={seedForm.soil_type}
                    onChange={(e) => setSeedForm({ ...seedForm, soil_type: e.target.value })}
                  >
                    {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Water Availability</label>
                  <select
                    className="input-field"
                    value={seedForm.water_availability}
                    onChange={(e) => setSeedForm({ ...seedForm, water_availability: e.target.value })}
                  >
                    <option value="High">High (Irrigated)</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low (Rainfed / Dryland)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">State</label>
                <select
                  className="input-field"
                  value={seedForm.state}
                  onChange={(e) => setSeedForm({ ...seedForm, state: e.target.value })}
                >
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Button type="submit" loading={seedLoading} variant="secondary" className="w-full">
                {t('Find Certified Seeds', 'उपयुक्त बीज खोजें')}
              </Button>
            </form>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex items-center justify-between">
            <Card.Title>{t('Seed Varieties & Sowing Advice', 'बीज किस्में और बुवाई सलाह')}</Card.Title>
            {seedResult?.ai_advice && <SpeakButton text={seedResult.ai_advice} language={appLanguage} />}
          </Card.Header>
          <Card.Content className="space-y-3">
            {seedResult ? (
              <>
                {seedResult.catalog_varieties?.map((v, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1"
                  >
                    <div className="flex justify-between text-sm font-bold">
                      <span>{v.variety}</span>
                      <span className="text-xs text-emerald-700 dark:text-emerald-300">{v.duration}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Season: {v.season} • Water: {v.water}
                    </p>
                    <p className="text-xs">{v.notes}</p>
                  </div>
                ))}
                {seedResult.ai_advice && (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 text-xs sm:text-sm whitespace-pre-wrap max-h-56 overflow-y-auto">
                    {seedResult.ai_advice}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500 py-10 text-center">
                {t('Choose crop & season to get certified seed suggestions.', 'बीज किस्म देखने के लिए फसल और मौसम चुनें।')}
              </p>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default CropSeedRecommendPage;
