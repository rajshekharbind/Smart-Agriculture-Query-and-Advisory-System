import React, { useEffect, useState } from 'react';
import { ShieldCheck, Cpu, Users, FileText } from 'lucide-react';
import { Card } from '../components';
import { agriService } from '../services';
import { useMode } from '../context';

const AdminDashboardPage = () => {
  const { t } = useMode();
  const [data, setData] = useState(null);

  useEffect(() => {
    agriService.getAdminOverview().then(setData).catch(() => {});
  }, []);

  const stats = data?.stats || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-violet-500" />
          {t('Admin & ML Model Monitoring Dashboard', 'एडमिन और ML मॉडल डैशबोर्ड')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {t('Monitor registered farmers, database records, FAISS knowledge base, and trained ML accuracies.', 'उपयोगकर्ता, डेटाबेस रिकॉर्ड, FAISS इंडेक्स और ML मॉडल की सटीकता देखें।')}
        </p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          ['Users', stats.total_users ?? 0],
          ['Posts', stats.community_posts ?? 0],
          ['Calendars', stats.crop_calendars ?? 0],
          ['Profit Logs', stats.profit_records ?? 0],
          ['Documents', stats.documents ?? 0],
          ['FAISS Chunks', stats.indexed_chunks ?? 0],
        ].map(([label, val]) => (
          <Card key={label} className="text-center p-4">
            <p className="text-xs text-slate-500 uppercase">{label}</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-300 mt-1">{val}</p>
          </Card>
        ))}
      </div>

      {/* Trained ML Models */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-500" />
            Trained Agricultural AI / ML Models
          </Card.Title>
        </Card.Header>
        <Card.Content className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(data?.models || []).map((m, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-emerald-500/20 space-y-1.5">
              <h4 className="text-sm font-bold">{m.name}</h4>
              <p className="text-xs text-slate-500">Dataset: {m.dataset}</p>
              <p className="text-xs">Samples: <strong>{m.samples}</strong> • Classes: <strong>{m.classes}</strong></p>
              {m.test_accuracy !== null && m.test_accuracy !== undefined && (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300">
                  Test Accuracy: {(m.test_accuracy * 100).toFixed(2)}%
                </p>
              )}
            </div>
          ))}
        </Card.Content>
      </Card>

      {/* Recent Users */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-500" />
            Recent Registered Accounts
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {data?.recent_users?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-xs">
                    <th className="py-2 px-2">Name</th>
                    <th className="py-2 px-2">Email</th>
                    <th className="py-2 px-2">Role</th>
                    <th className="py-2 px-2">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {data.recent_users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2 px-2 font-medium">{u.name}</td>
                      <td className="py-2 px-2">{u.email}</td>
                      <td className="py-2 px-2 capitalize">{u.role}</td>
                      <td className="py-2 px-2 text-xs text-slate-500">{u.created_at?.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <FileText className="w-4 h-4" /> No registered users yet — register on the Login page to see accounts here.
            </p>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
