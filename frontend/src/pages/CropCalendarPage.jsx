import React, { useEffect, useState } from 'react';
import { CalendarDays, Trash2 } from 'lucide-react';
import { Card, Button } from '../components';
import { agriService } from '../services';
import { useMode } from '../context';
import { SOIL_TYPES } from '../utils/constants';

const CropCalendarPage = () => {
  const { t } = useMode();
  const [calendars, setCalendars] = useState([]);
  const [form, setForm] = useState({
    crop_name: 'Paddy',
    sowing_date: new Date().toISOString().slice(0, 10),
    area_acres: 2,
    soil_type: 'Loamy',
  });
  const [loading, setLoading] = useState(false);

  const loadCalendars = async () => {
    const res = await agriService.getCalendars();
    setCalendars(res.calendars || []);
  };

  useEffect(() => {
    loadCalendars().catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await agriService.createCalendar(form);
      await loadCalendars();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await agriService.deleteCalendar(id);
    await loadCalendars();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-cyan-500" />
          {t('Crop Calendar & Activity Planner', 'फसल कैलेंडर')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {t('Generate sowing-to-harvest milestone dates for irrigation, fertilizer & pest checks.', 'बुवाई से कटाई तक सिंचाई, खाद और कीट जांच की तारीखें तय करें।')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{t('Create Crop Schedule', 'नया शेड्यूल बनाएं')}</Card.Title>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Crop Name</label>
                <input className="input-field" value={form.crop_name} onChange={(e) => setForm({ ...form, crop_name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Sowing Date</label>
                <input type="date" className="input-field" value={form.sowing_date} onChange={(e) => setForm({ ...form, sowing_date: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Area (Acres)</label>
                <input type="number" step="0.1" className="input-field" value={form.area_acres} onChange={(e) => setForm({ ...form, area_acres: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Soil Type</label>
                <select className="input-field" value={form.soil_type} onChange={(e) => setForm({ ...form, soil_type: e.target.value })}>
                  {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Button type="submit" loading={loading} className="w-full">
                {t('Generate Crop Calendar', 'कैलेंडर बनाएं')}
              </Button>
            </form>
          </Card.Content>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {calendars.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500 text-center py-10">
                No crop calendars created yet. Add one on the left!
              </p>
            </Card>
          ) : (
            calendars.map((cal) => (
              <Card key={cal.id}>
                <Card.Header className="flex items-center justify-between">
                  <div>
                    <Card.Title>{cal.crop_name} ({cal.area_acres} Acres)</Card.Title>
                    <p className="text-xs text-slate-500">Sowing: {cal.sowing_date} • Soil: {cal.soil_type}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(cal.id)}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10"
                    title="Delete schedule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Card.Header>
                <Card.Content className="space-y-2">
                  {cal.milestones?.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 text-xs"
                    >
                      <div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">
                          Day {m.day} • {m.stage}
                        </span>
                        <p className="text-slate-600 dark:text-slate-300">{m.task}</p>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 flex-shrink-0">{m.date}</span>
                    </div>
                  ))}
                </Card.Content>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CropCalendarPage;
