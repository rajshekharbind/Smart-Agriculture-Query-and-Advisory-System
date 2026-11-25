import React, { useState } from 'react';
import { Bug, Upload, Camera, X } from 'lucide-react';
import { Card, Button, Alert, Loading, CameraCaptureModal, SpeakButton } from '../components';
import { agriService } from '../services';
import { useMode } from '../context';

const PestIdentificationPage = () => {
  const { appLanguage, t } = useMode();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleSelect = (selected) => {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await agriService.identifyPest(file, appLanguage);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bug className="w-6 h-6 text-rose-500" />
          {t('AI Pest & Insect Identification', 'AI कीट पहचान और रोकथाम')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {t(
            'Upload or capture a clear photo of an insect or damaged plant part to get organic-first control steps.',
            'फसल पर लगे कीड़े की फोटो डालें और सुरक्षित रोकथाम के उपाय जानें।'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{t('Upload or Capture Insect Photo', 'कीट की फोटो चुनें या खींचें')}</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {t('Choose Image', 'फोटो अपलोड करें')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleSelect(e.target.files[0])}
                />
              </label>
              <Button variant="outline" onClick={() => setCameraOpen(true)}>
                <Camera className="w-4 h-4 mr-2" />
                {t('Open Camera', 'कैमरा खोलें')}
              </Button>
            </div>

            {preview && (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-emerald-500/25">
                  <img src={preview} alt="Pest preview" className="w-full h-64 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <Button onClick={handleAnalyze} loading={loading} className="w-full">
                  {t('Identify Pest & Prevention', 'कीट की पहचान करें')}
                </Button>
              </div>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex items-center justify-between">
            <Card.Title>{t('Pest Analysis & Control', 'पहचान और नियंत्रण सलाह')}</Card.Title>
            {result?.analysis && <SpeakButton text={result.analysis} language={appLanguage} />}
          </Card.Header>
          <Card.Content className="space-y-4">
            {loading && <Loading text={t('Inspecting pest image...', 'फोटो की जांच हो रही है...')} />}
            {error && <Alert type="error">{error}</Alert>}

            {!loading && result ? (
              <>
                {result.quality?.quality_warning && (
                  <Alert type="warning">{result.quality.quality_warning}</Alert>
                )}
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 text-xs sm:text-sm whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {result.analysis}
                </div>
                <Alert type="warning">{result.disclaimer}</Alert>
              </>
            ) : (
              !loading && (
                <p className="text-sm text-slate-500 py-12 text-center">
                  {t('Upload a pest photo to view identification and control recommendations.', 'सलाह देखने के लिए कीट की फोटो अपलोड करें।')}
                </p>
              )
            )}
          </Card.Content>
        </Card>
      </div>

      <CameraCaptureModal open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={handleSelect} />
    </div>
  );
};

export default PestIdentificationPage;
