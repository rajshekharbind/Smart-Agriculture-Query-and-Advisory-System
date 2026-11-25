import React, { useEffect, useState } from 'react';
import { Landmark, ExternalLink, ShieldAlert } from 'lucide-react';
import { Card, Button, Alert, SpeakButton } from '../components';
import { agriService } from '../services';
import { useMode } from '../context';

const SchemesInsurancePage = () => {
  const { appLanguage, t } = useMode();
  const [category, setCategory] = useState('All');
  const [schemesData, setSchemesData] = useState({ schemes: [], categories: [] });

  const [insForm, setInsForm] = useState({
    crop: 'Paddy',
    damage_cause: 'Heavy Rainfall / Flooding',
    damage_date: new Date().toISOString().slice(0, 10),
  });
  const [insResult, setInsResult] = useState(null);
  const [insLoading, setInsLoading] = useState(false);

  useEffect(() => {
    agriService.getSchemes(category).then(setSchemesData).catch(() => {});
  }, [category]);

  const handleInsurance = async (e) => {
    e.preventDefault();
    setInsLoading(true);
    try {
      const res = await agriService.getInsuranceHelp({ ...insForm, language: appLanguage });
      setInsResult(res);
    } finally {
      setInsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Landmark className="w-6 h-6 text-indigo-500" />
            {t('Government Schemes & Crop Insurance', 'सरकारी योजनाएं और फसल बीमा')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {t('Official Indian agricultural subsidies, eligibility, documents & PMFBY claim guidance.', 'पात्रता, आवश्यक दस्तावेज़, आधिकारिक लिंक और फसल बीमा क्लेम सहायता।')}
          </p>
        </div>

        <select
          className="input-field w-48"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          {schemesData.categories?.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schemesData.schemes?.map((s) => (
          <Card key={s.id} className="flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{s.name}</h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                  {s.category}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                {s.benefit}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                <strong>Eligibility:</strong> {s.eligibility}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {s.documents.map((doc) => (
                  <span
                    key={doc}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {doc}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <SpeakButton text={`${s.name}. ${s.benefit}. Eligibility: ${s.eligibility}`} language={appLanguage} />
              <a
                href={s.official_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline"
              >
                Official Portal <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </Card>
        ))}
      </div>

      {/* Crop Insurance Claim Assistant */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            {t('PMFBY Crop Insurance Claim Assistant', 'फसल बीमा क्लेम सहायक (PMFBY)')}
          </Card.Title>
        </Card.Header>
        <Card.Content className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleInsurance} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Affected Crop</label>
              <input className="input-field" value={insForm.crop} onChange={(e) => setInsForm({ ...insForm, crop: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Damage Cause</label>
              <input className="input-field" value={insForm.damage_cause} onChange={(e) => setInsForm({ ...insForm, damage_cause: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Date of Damage</label>
              <input type="date" className="input-field" value={insForm.damage_date} onChange={(e) => setInsForm({ ...insForm, damage_date: e.target.value })} />
            </div>
            <Button type="submit" loading={insLoading} className="w-full">
              {t('Generate Claim Checklist & Guide', 'क्लेम गाइड और सूची बनाएं')}
            </Button>
          </form>

          <div>
            {insResult ? (
              <div className="space-y-3">
                <Alert type="info">Helpline: <strong>{insResult.helpline}</strong></Alert>
                <ul className="space-y-1.5 text-xs sm:text-sm list-disc pl-5">
                  {insResult.checklist?.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
                {insResult.ai_guidance && (
                  <div className="space-y-2">
                    <div className="flex justify-end">
                      <SpeakButton text={insResult.ai_guidance} language={appLanguage} />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {insResult.ai_guidance}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">
                {t('Enter crop damage details to get step-by-step PMFBY claim documentation steps.', 'क्लेम प्रक्रिया देखने के लिए फसल नुकसान की जानकारी भरें।')}
              </p>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default SchemesInsurancePage;
