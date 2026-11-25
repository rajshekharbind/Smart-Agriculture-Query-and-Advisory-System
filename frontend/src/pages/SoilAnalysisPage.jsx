import React, { useState } from 'react';
import { FlaskConical, Camera, Upload, Download } from 'lucide-react';
import { Card, Button, Alert, CameraCaptureModal, SpeakButton } from '../components';
import { agriService } from '../services';
import { useMode } from '../context';
import { SOIL_TYPES } from '../utils/constants';

const SoilAnalysisPage = () => {
  const { appLanguage, t } = useMode();
  const [form, setForm] = useState({
    nitrogen: 40,
    phosphorus: 25,
    potassium: 30,
    ph: 6.4,
    moisture: 45,
    temperature: 28,
    humidity: 68,
    soil_type: 'Loamy',
    crop_type: 'Paddy',
  });
  const [result, setResult] = useState(null);
  const [imgResult, setImgResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await agriService.analyzeSoil({ ...form, language: appLanguage });
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSoilImage = async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setImgLoading(true);
    setError(null);
    try {
      const data = await agriService.analyzeSoilImage(file, appLanguage);
      setImgResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setImgLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;
    agriService.downloadPdfReport('AgroSathi AI — Soil Health & Fertilizer Report', [
      {
        heading: 'Soil Inputs',
        body: `Crop: ${form.crop_type} | Soil: ${form.soil_type}\nN=${form.nitrogen}, P=${form.phosphorus}, K=${form.potassium}, pH=${form.ph}, Moisture=${form.moisture}%`,
      },
      {
        heading: 'Recommended Fertilizer & pH Status',
        body: `Fertilizer: ${result.recommended_fertilizer}\n${result.ph_status}\n\nDeficiencies:\n- ${(result.deficiencies || []).join('\n- ')}`,
      },
      {
        heading: 'Advisory Notes',
        body: result.ai_guidance || 'Apply organic compost and follow balanced NPK doses.',
      },
    ]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-amber-500" />
          {t('Soil Health & Fertilizer Assistant', 'मिट्टी स्वास्थ्य और खाद सलाहकार')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {t(
            'Enter soil test values (NPK & pH) for ML fertilizer recommendation, or explore a soil photo.',
            'NPK और pH डालकर सही खाद जानें या मिट्टी की फोटो से जांच करें।'
          )}
        </p>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NPK Input Form */}
        <Card>
          <Card.Header>
            <Card.Title>{t('Soil Test Values (NPK & pH)', 'मिट्टी परीक्षण मान')}</Card.Title>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ['nitrogen', 'Nitrogen (N)'],
                  ['phosphorus', 'Phosphorus (P)'],
                  ['potassium', 'Potassium (K)'],
                  ['ph', 'Soil pH'],
                  ['moisture', 'Moisture (%)'],
                  ['temperature', 'Temp (°C)'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      {label}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field"
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Soil Type
                  </label>
                  <select
                    className="input-field"
                    value={form.soil_type}
                    onChange={(e) => setForm({ ...form, soil_type: e.target.value })}
                  >
                    {SOIL_TYPES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Target Crop
                  </label>
                  <input
                    className="input-field"
                    value={form.crop_type}
                    onChange={(e) => setForm({ ...form, crop_type: e.target.value })}
                    placeholder="e.g. Paddy, Maize, Cotton"
                  />
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full">
                {t('Analyze Soil & Recommend Fertilizer', 'मिट्टी जांचें और खाद पाएं')}
              </Button>
            </form>
          </Card.Content>
        </Card>

        {/* Soil Results */}
        <Card>
          <Card.Header className="flex items-center justify-between">
            <Card.Title>{t('Soil Analysis Report', 'मिट्टी विश्लेषण रिपोर्ट')}</Card.Title>
            {result && (
              <div className="flex items-center gap-2">
                <SpeakButton
                  text={`${result.recommended_fertilizer}. ${result.ph_status}. ${result.ai_guidance || ''}`}
                  language={appLanguage}
                />
                <Button size="sm" variant="outline" onClick={handleDownloadReport}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  PDF
                </Button>
              </div>
            )}
          </Card.Header>
          <Card.Content>
            {result ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                  <p className="text-xs uppercase text-emerald-700 dark:text-emerald-300 font-semibold">
                    Recommended Fertilizer (ML Model)
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {result.recommended_fertilizer}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">{result.ph_status}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-500">Nutrient Check</h4>
                  {result.deficiencies?.map((d, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-slate-800 dark:text-amber-200"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {result.ai_guidance && (
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm whitespace-pre-wrap text-slate-800 dark:text-slate-200 max-h-56 overflow-y-auto">
                    {result.ai_guidance}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-10 text-center">
                {t('Submit soil test values to see nutrient analysis & fertilizer advice.', 'रिपोर्ट देखने के लिए बाईं ओर मिट्टी का डेटा भरें।')}
              </p>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Soil Image Exploration */}
      <Card>
        <Card.Header>
          <Card.Title>{t('Soil Photo Exploration (Visual Check)', 'मिट्टी की फोटो से जांच')}</Card.Title>
        </Card.Header>
        <Card.Content className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {t('Upload Soil Photo', 'मिट्टी की फोटो चुनें')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleSoilImage(e.target.files[0])}
                />
              </label>
              <Button variant="outline" onClick={() => setCameraOpen(true)}>
                <Camera className="w-4 h-4 mr-2" />
                {t('Use Camera', 'कैमरा खोलें')}
              </Button>
            </div>
            {preview && (
              <img src={preview} alt="Soil sample" className="w-full h-48 object-cover rounded-xl border border-emerald-500/25" />
            )}
          </div>

          <div>
            {imgLoading && <p className="text-sm text-emerald-500">Analyzing soil photo...</p>}
            {imgResult && (
              <div className="space-y-2">
                <div className="flex justify-end">
                  <SpeakButton text={imgResult.analysis} language={appLanguage} />
                </div>
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 text-xs sm:text-sm whitespace-pre-wrap">
                  {imgResult.analysis}
                </div>
                <Alert type="warning">{imgResult.disclaimer}</Alert>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleSoilImage}
      />
    </div>
  );
};

export default SoilAnalysisPage;
