import React, { useEffect, useState } from 'react';
import { Leaf, Wrench } from 'lucide-react';
import { Card, SpeakButton } from '../components';
import { agriService } from '../services';
import { useMode } from '../context';

const GuidesPage = () => {
  const { appLanguage, t } = useMode();
  const [tab, setTab] = useState('organic');
  const [organic, setOrganic] = useState([]);
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    agriService.getOrganicGuides().then((d) => setOrganic(d.guides || [])).catch(() => {});
    agriService.getEquipmentGuides().then((d) => setEquipment(d.equipment || [])).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Leaf className="w-6 h-6 text-emerald-500" />
            {t('Organic Farming & Equipment Guides', 'जैविक खेती और कृषि यंत्र गाइड')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {t('Step-by-step natural farming methods, bio-pesticides, machinery selection & maintenance.', 'खाद, प्राकृतिक कीटनाशक और कृषि उपकरणों की रखरखाव जानकारी।')}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('organic')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 ${
              tab === 'organic'
                ? 'bg-emerald-600 text-white'
                : 'bg-white/80 dark:bg-slate-900/70 border border-emerald-500/25'
            }`}
          >
            <Leaf className="w-4 h-4" />
            {t('Organic Farming', 'जैविक खेती')}
          </button>
          <button
            type="button"
            onClick={() => setTab('equipment')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 ${
              tab === 'equipment'
                ? 'bg-emerald-600 text-white'
                : 'bg-white/80 dark:bg-slate-900/70 border border-emerald-500/25'
            }`}
          >
            <Wrench className="w-4 h-4" />
            {t('Equipment Guide', 'कृषि यंत्र')}
          </button>
        </div>
      </div>

      {tab === 'organic' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {organic.map((g, idx) => (
            <Card key={idx} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium">
                    {g.category}
                  </span>
                  <h3 className="text-base font-bold mt-1">{g.title}</h3>
                </div>
                <SpeakButton text={`${g.title}. ${g.steps.join(' ')}`} language={appLanguage} />
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {g.steps.map((st, sIdx) => (
                  <li key={sIdx}>{st}</li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equipment.map((eq, idx) => (
            <Card key={idx} className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold">{eq.name}</h3>
                <SpeakButton
                  text={`${eq.name}. Best for ${eq.best_for}. Maintenance: ${eq.maintenance}`}
                  language={appLanguage}
                />
              </div>
              <p className="text-xs sm:text-sm"><strong>Best For:</strong> {eq.best_for}</p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <strong>Maintenance:</strong> {eq.maintenance}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 rounded-lg p-2">
                {eq.subsidy_note}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuidesPage;
