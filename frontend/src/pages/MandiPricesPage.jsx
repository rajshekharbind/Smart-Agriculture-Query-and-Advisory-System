import React, { useEffect, useState } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, Alert } from '../components';
import { agriService } from '../services';
import { useMode } from '../context';

const MandiPricesPage = () => {
  const { t } = useMode();
  const [stateFilter, setStateFilter] = useState('All');
  const [cropSearch, setCropSearch] = useState('');
  const [data, setData] = useState({ prices: [], states: [], notice: '' });

  useEffect(() => {
    agriService.getMandiPrices(stateFilter, cropSearch).then(setData).catch(() => {});
  }, [stateFilter, cropSearch]);

  const maxModal = Math.max(1, ...(data.prices || []).map((p) => p.modal_price));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            {t('Mandi Price Information', 'मंडी भाव जानकारी')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {t('Compare regional APMC mandi prices across Indian states.', 'विभिन्न राज्यों की मंडियों के भाव की तुलना करें।')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            className="input-field w-40"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="All">All States</option>
            {data.states?.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            className="input-field w-44"
            value={cropSearch}
            onChange={(e) => setCropSearch(e.target.value)}
            placeholder="Filter crop..."
          />
        </div>
      </div>

      {data.is_demo && (
        <Alert type="warning">
          <strong>Reference / Demo Data:</strong> {data.notice}
        </Alert>
      )}

      {/* Price Table */}
      <Card>
        <Card.Content className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
                <th className="py-3 px-2">Crop</th>
                <th className="py-3 px-2">Mandi</th>
                <th className="py-3 px-2">State</th>
                <th className="py-3 px-2">Min - Max</th>
                <th className="py-3 px-2">Modal Price</th>
                <th className="py-3 px-2">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {data.prices?.map((row, i) => (
                <tr key={i} className="hover:bg-emerald-500/5">
                  <td className="py-3 px-2 font-semibold">{row.crop}</td>
                  <td className="py-3 px-2">{row.mandi}</td>
                  <td className="py-3 px-2 text-xs text-slate-500">{row.state}</td>
                  <td className="py-3 px-2 tabular-nums">₹{row.min_price.toLocaleString()} - ₹{row.max_price.toLocaleString()}</td>
                  <td className="py-3 px-2 font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                    ₹{row.modal_price.toLocaleString()} <span className="text-[11px] font-normal text-slate-500">/{row.unit}</span>
                  </td>
                  <td className="py-3 px-2">
                    {row.trend === 'up' && (
                      <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <ArrowUpRight className="w-4 h-4 mr-0.5" /> Up
                      </span>
                    )}
                    {row.trend === 'down' && (
                      <span className="inline-flex items-center text-xs text-rose-500 font-medium">
                        <ArrowDownRight className="w-4 h-4 mr-0.5" /> Down
                      </span>
                    )}
                    {row.trend === 'stable' && (
                      <span className="inline-flex items-center text-xs text-slate-500 font-medium">
                        <Minus className="w-4 h-4 mr-0.5" /> Stable
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card.Content>
      </Card>

      {/* Visual Price Comparison */}
      <Card>
        <Card.Header>
          <Card.Title>{t('Modal Price Comparison', 'मंडी भाव तुलना चार्ट')}</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-3">
          {data.prices?.slice(0, 8).map((row, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span>{row.crop} ({row.mandi})</span>
                <span>₹{row.modal_price.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5">
                <div
                  className="bg-amber-500 h-2.5 rounded-full"
                  style={{ width: `${Math.min(100, (row.modal_price / maxModal) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </Card.Content>
      </Card>
    </div>
  );
};

export default MandiPricesPage;
