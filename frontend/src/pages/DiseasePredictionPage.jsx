import React, { useState } from 'react';
import { Upload, Search, MessageCircle, Leaf, X, ShieldAlert, Camera, Download } from 'lucide-react';
import { Button, Card, Loading, Alert, CameraCaptureModal, SpeakButton } from '../components';
import { diseaseService, agriService } from '../services';
import { useChat, useMode } from '../context';

const DiseasePredictionPage = ({ onNavigateToChat }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [predictionResults, setPredictionResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const { setPendingInput } = useChat();
  const { appLanguage, t } = useMode();

  const selectImageFile = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setPredictionResults(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setPredictionResults(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      setError(null);
      const result = await diseaseService.predictDisease(selectedFile);
      if (result.error) {
        setError(result.error);
      } else {
        setPredictionResults(result);
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err.message ||
          'Disease prediction failed. Verify backend.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAskAboutPrediction = () => {
    if (predictionResults?.prediction) {
      const question = `My crop leaf image showed possible '${predictionResults.prediction}'. Can you explain symptoms to check, organic/safe precautions, and next steps in ${appLanguage}?`;
      setPendingInput(question);
      if (onNavigateToChat) onNavigateToChat();
    }
  };

  const getConfidence = () => {
    if (!predictionResults?.probabilities?.length) return 0;
    return Math.max(...predictionResults.probabilities) * 100;
  };

  const getProbabilityData = () => {
    if (predictionResults?.top_predictions?.length) {
      return predictionResults.top_predictions.map((item) => ({
        class: item.label,
        probability: item.probability * 100,
      }));
    }
    if (!predictionResults?.probabilities) return [];
    return predictionResults.probabilities
      .map((prob, index) => ({
        class: `Class ${index}`,
        probability: prob * 100,
      }))
      .sort((a, b) => b.probability - a.probability);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Leaf className="w-6 h-6 text-emerald-500" />
          {t('AI Crop Disease Detection', 'AI फसल रोग पहचान')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {t(
            'Upload or capture a clear photo of an affected leaf to view possible disease matches and precautionary guidance.',
            'प्रभावित पत्ती की फोटो अपलोड करें या कैमरे से खींचें और संभावित रोग व सावधानियां जानें।'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{t('Upload or Capture Crop Leaf Image', 'पत्ती की फोटो चुनें या खींचें')}</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <Alert type="info">
              Best results come from well-lit, close-up photos of a single leaf on a plain background.
            </Alert>

            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {t('Choose Image', 'फोटो चुनें')}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => selectImageFile(e.target.files[0])}
                  className="hidden"
                />
              </label>

              <Button variant="outline" onClick={() => setCameraOpen(true)}>
                <Camera className="w-4 h-4 mr-2" />
                {t('Use Camera', 'कैमरा खोलें')}
              </Button>
            </div>

            {preview && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-emerald-500/25">
                  <img src={preview} alt="Crop leaf preview" className="w-full h-64 object-cover" />
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/75 text-white"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={loading || !selectedFile}
                  className="w-full"
                  loading={loading}
                >
                  <Search className="w-4 h-4 mr-2" />
                  {t('Analyze Leaf Image', 'पत्ती की जांच करें')}
                </Button>
              </div>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex items-center justify-between">
            <Card.Title>{t('Diagnosis & Precautions', 'जांच परिणाम और सावधानियां')}</Card.Title>
            {predictionResults && (
              <div className="flex gap-2">
                <SpeakButton
                  text={`Possible match: ${predictionResults.prediction}. Confidence ${getConfidence().toFixed(1)} percent. ${predictionResults.ai_guidance || ''}`}
                  language={appLanguage}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    agriService.downloadPdfReport('AgroSathi AI — Crop Leaf Check Report', [
                      {
                        heading: 'Prediction Summary',
                        body: `Possible Match: ${predictionResults.prediction}\nConfidence: ${getConfidence().toFixed(1)}%\nModel: ${predictionResults.model_source}`,
                      },
                      { heading: 'Guidance', body: predictionResults.ai_guidance || '' },
                      { heading: 'Disclaimer', body: predictionResults.disclaimer || '' },
                    ])
                  }
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> PDF
                </Button>
              </div>
            )}
          </Card.Header>
          <Card.Content>
            {loading && (
              <div className="flex justify-center py-12">
                <Loading text={t('Analyzing leaf patterns...', 'पत्ती की जांच हो रही है...')} />
              </div>
            )}

            {error && (
              <Alert type="error" className="mb-4" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {!loading && predictionResults ? (
              <div className="space-y-4">
                {predictionResults.quality?.quality_warning && (
                  <Alert type="warning">{predictionResults.quality.quality_warning}</Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                    <p className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-semibold mb-1">
                      Possible Condition
                    </p>
                    <p className="text-lg font-bold break-words">
                      {predictionResults.prediction || 'No prediction'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-center">
                    <p className="text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 font-semibold mb-1">
                      Confidence Score
                    </p>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
                      {getConfidence().toFixed(1)}%
                    </p>
                  </div>
                </div>

                {getProbabilityData().length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold">Top Class Probabilities</h4>
                      {predictionResults.model_source && (
                        <span className="text-[11px] text-slate-500 truncate max-w-[210px]">
                          {predictionResults.model_source}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {getProbabilityData().slice(0, 5).map((item, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="truncate">{item.class}</span>
                            <span className="font-medium text-emerald-700 dark:text-emerald-300 tabular-nums">
                              {item.probability.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, item.probability)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {predictionResults.ai_guidance && (
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 text-xs sm:text-sm whitespace-pre-wrap max-h-56 overflow-y-auto">
                    {predictionResults.ai_guidance}
                  </div>
                )}

                {predictionResults.disclaimer && (
                  <Alert type="warning">{predictionResults.disclaimer}</Alert>
                )}

                <Button onClick={handleAskAboutPrediction} variant="secondary" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t('Ask Expert About This in Chat', 'इसके बारे में चैट में पूछें')}
                </Button>
              </div>
            ) : (
              !loading && (
                <div className="text-center py-14 px-4 text-slate-500 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm">
                    {t('Upload or capture a leaf photo to run AI disease inspection.', 'जांच शुरू करने के लिए पत्ती की फोटो अपलोड करें।')}
                  </p>
                </div>
              )
            )}
          </Card.Content>
        </Card>
      </div>

      <CameraCaptureModal open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={selectImageFile} />
    </div>
  );
};

export default DiseasePredictionPage;
