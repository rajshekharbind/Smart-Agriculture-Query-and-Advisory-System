import React, { useEffect, useState } from 'react';
import { Calculator, Download } from 'lucide-react';
import { Card, Button, SpeakButton } from '../components';
import { agriService } from '../services';
import { useMode } from '../context';

const ProfitCalculatorPage = () => {
  const { appLanguage, t } = useMode();
  const [form, setForm] = useState({
    crop_name: 'Paddy',
    area_acres: 2,
    seed_cost: 2500,
    fertilizer_cost: 5500,
    labor_cost: 12000,
    irrigation_cost: 2000,
    other_cost: 1500,
    expected_yield_quintals: 32,
    selling_price_per_quintal: 2300,
  });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    const res = await agriService.getProfitHistory();
    setHistory(res.records || []);
  };

  useEffect(() => {
    loadHistory().catch(() => {});
  }, []);

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await agriService.calculateProfit(form);
      setResult(res);
      await loadHistory();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calculator className="w-6 h-6 text-emerald-500" />
          {t('Farm Cost & Profit Calculator', 'खेती लागत और मुनाफा कैलकुलेटर')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {t('Calculate expenses, expected revenue, break-even price, ROI, and net farm profit.', 'खर्च, कुल आय, लागत-सम मूल्य और शुद्ध लाभ की गणना करें।')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{t('Enter Expenses & Expected Harvest', 'खर्च और उपज विवरण भरें')}</Card.Title>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleCalculate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Crop Name</label>
                  <input className="input-field" value={form.crop_name} onChange={(e) => setForm({ ...form, crop_name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Area (Acres)</label>
                  <input type="number" step="0.1" className="input-field" value={form.area_acres} onChange={(e) => setForm({ ...form, area_acres: Number(e.target.value) })} />
                </div>
                {[
                  ['seed_cost', 'Seed Cost (₹)'],
                  ['fertilizer_cost', 'Fertilizer/Manure (₹)'],
                  ['labor_cost', 'Labor & Machinery (₹)'],
                  ['irrigation_cost', 'Irrigation/Power (₹)'],
                  ['other_cost', 'Other Expenses (₹)'],
                  ['expected_yield_quintals', 'Expected Yield (Quintals)'],
                  ['selling_price_per_quintal', 'Selling Price (₹/Quintal)'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1">{label}</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="input-field"
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                    />
                  </div>
                ))}
              </div>
              <Button type="submit" loading={loading} className="w-full">
                {t('Calculate & Save Record', 'लाभ निकालें और सेव करें')}
              </Button>
            </form>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex items-center justify-between">
            <Card.Title>{t('Profit & Break-Even Summary', 'मुनाफा रिपोर्ट')}</Card.Title>
            {result && (
              <div className="flex gap-2">
                <SpeakButton
                  text={`Total cost ${result.total_cost} rupees, revenue ${result.revenue} rupees, net profit ${result.profit} rupees.`}
                  language={appLanguage}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    agriService.downloadPdfReport(`AgroSathi Profit Report - ${result.crop_name}`, [
                      {
                        heading: 'Financial Summary',
                        body: `Crop: ${result.crop_name} (${result.area_acres} Acres)\nTotal Cost: Rs. ${result.total_cost}\nRevenue: Rs. ${result.revenue}\nNet Profit: Rs. ${result.profit}\nROI: ${result.roi_percent}%\nBreak-even Price: Rs. ${result.breakeven_price_per_quintal}/Quintal`,
                      },
                    ])
                  }
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> PDF
                </Button>
              </div>
            )}
          </Card.Header>
          <Card.Content>
            {result ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/60">
                    <p className="text-xs text-slate-500">Total Cost</p>
                    <p className="text-xl font-bold">₹{result.total_cost.toLocaleString()}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-sky-500/15 border border-sky-500/25">
                    <p className="text-xs text-sky-700 dark:text-sky-300">Expected Revenue</p>
                    <p className="text-xl font-bold">₹{result.revenue.toLocaleString()}</p>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${result.profit >= 0 ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-rose-500/15 border-rose-500/30'}`}>
                    <p className="text-xs font-semibold">Net Profit</p>
                    <p className="text-2xl font-extrabold">₹{result.profit.toLocaleString()}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/25">
                    <p className="text-xs text-amber-700 dark:text-amber-300">ROI / Break-Even</p>
                    <p className="text-lg font-bold">{result.roi_percent}% ROI</p>
                    <p className="text-xs">₹{result.breakeven_price_per_quintal}/Q</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-10 text-center">
                {t('Enter your crop expenses and yield to view profit calculations.', 'मुनाफा देखने के लिए बाईं ओर खर्च और उपज भरें।')}
              </p>
            )}

            {history.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-500">Saved Calculations</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {history.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex justify-between text-xs p-2 rounded-lg bg-slate-100 dark:bg-slate-950/60">
                      <span>{r.crop_name} ({r.area_acres} ac)</span>
                      <span className={r.profit >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                        ₹{Number(r.profit).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default ProfitCalculatorPage;
