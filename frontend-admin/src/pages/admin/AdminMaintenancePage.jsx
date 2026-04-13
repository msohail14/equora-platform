import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Calendar, Clock, Plus, Stethoscope } from 'lucide-react';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import Modal from '../../components/ui/Modal';
import {
  getMaintenanceOverviewApi,
  createMaintenanceLogApi,
  getHorsesByStableApi,
} from '../../features/operations/operationsApi';

const TYPE_OPTIONS = [
  { value: 'vet_visit', label: 'Vet Visit' },
  { value: 'farrier', label: 'Farrier' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'deworming', label: 'Deworming' },
  { value: 'dental', label: 'Dental' },
  { value: 'injury', label: 'Injury' },
  { value: 'general', label: 'General' },
];

const typeColor = (type) => {
  const map = {
    vet_visit: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    farrier: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    vaccination: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    deworming: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    dental: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    injury: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    general: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  return map[type] || map.general;
};

const typeLabel = (type) => TYPE_OPTIONS.find((t) => t.value === type)?.label || type;

const AdminMaintenancePage = () => {
  const admin = useSelector((state) => state.auth.admin);
  const stableId = admin?.stable_id;

  const [overview, setOverview] = useState(null);
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    horse_id: '', type: 'vet_visit', title: '', description: '',
    provider_name: '', cost: '', date_performed: new Date().toISOString().slice(0, 10),
    next_due_date: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ovRes, horsesRes] = await Promise.all([
        stableId ? getMaintenanceOverviewApi(stableId) : Promise.resolve({ data: { data: {} } }),
        stableId ? getHorsesByStableApi(stableId, { page: 1, limit: 100 }) : Promise.resolve({ data: { data: [] } }),
      ]);
      setOverview(ovRes?.data?.data || ovRes?.data || {});
      const horseList = horsesRes?.data?.data || horsesRes?.data?.horses || [];
      setHorses(Array.isArray(horseList) ? horseList : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load maintenance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [stableId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.horse_id || !form.title || !form.date_performed) {
      toast.error('Horse, title, and date are required.');
      return;
    }
    try {
      await createMaintenanceLogApi(form.horse_id, {
        type: form.type,
        title: form.title,
        description: form.description || undefined,
        provider_name: form.provider_name || undefined,
        cost: form.cost ? Number(form.cost) : undefined,
        date_performed: form.date_performed,
        next_due_date: form.next_due_date || undefined,
      });
      toast.success('Maintenance log added.');
      setIsModalOpen(false);
      setForm({ horse_id: '', type: 'vet_visit', title: '', description: '', provider_name: '', cost: '', date_performed: new Date().toISOString().slice(0, 10), next_due_date: '' });
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create log.');
    }
  };

  const overdue = overview?.overdue || [];
  const dueSoon = overview?.due_soon || [];
  const recentLogs = overview?.recent_logs || [];
  const summary = overview?.summary || {};

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Horse Maintenance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track veterinary care, farrier visits, vaccinations, and more.</p>
        </div>
        <AppButton onClick={() => setIsModalOpen(true)}>
          <Plus size={16} className="mr-1" /> Add Log
        </AppButton>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading maintenance data...</p>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryCard label="Overdue" value={summary.overdue_count || 0} color="text-red-600" bg="bg-red-50 dark:bg-red-900/20" icon={AlertTriangle} />
            <SummaryCard label="Due Soon" value={summary.due_soon_count || 0} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/20" icon={Clock} />
            <SummaryCard label="Injured Horses" value={summary.injured_horses || 0} color="text-red-600" bg="bg-red-50 dark:bg-red-900/20" icon={Stethoscope} />
            <SummaryCard label="Needs Attention" value={summary.needs_attention || 0} color="text-orange-600" bg="bg-orange-50 dark:bg-orange-900/20" icon={AlertTriangle} />
          </div>

          {/* Overdue section */}
          {overdue.length > 0 && (
            <Section title="Overdue" titleColor="text-red-600" items={overdue} />
          )}

          {/* Due soon section */}
          {dueSoon.length > 0 && (
            <Section title="Due This Week" titleColor="text-amber-600" items={dueSoon} />
          )}

          {/* Recent logs */}
          <Section title="Recent Activity" titleColor="text-gray-700 dark:text-gray-200" items={recentLogs} />
        </>
      )}

      {/* Add log modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Maintenance Log">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Horse *</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              value={form.horse_id}
              onChange={(e) => setForm({ ...form, horse_id: e.target.value })}
              required
            >
              <option value="">Select horse...</option>
              {horses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type *</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <FormInput label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Date Performed *" type="date" value={form.date_performed} onChange={(e) => setForm({ ...form, date_performed: e.target.value })} required />
            <FormInput label="Next Due Date" type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Provider" value={form.provider_name} onChange={(e) => setForm({ ...form, provider_name: e.target.value })} />
            <FormInput label="Cost (SAR)" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </div>
          <FormInput label="Notes" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <AppButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</AppButton>
            <AppButton type="submit">Save Log</AppButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const SummaryCard = ({ label, value, color, bg, icon: Icon }) => (
  <div className={`rounded-xl border border-gray-200 p-4 dark:border-gray-800 ${bg}`}>
    <div className="flex items-center gap-2">
      {Icon && <Icon size={18} className={color} />}
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</p>
  </div>
);

const Section = ({ title, titleColor, items }) => (
  <div>
    <h2 className={`mb-3 text-lg font-semibold ${titleColor}`}>{title}</h2>
    {items.length === 0 ? (
      <p className="text-sm text-gray-400 dark:text-gray-500">No records.</p>
    ) : (
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th className="px-3 py-2">Horse</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Next Due</th>
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2">Cost</th>
            </tr>
          </thead>
          <tbody>
            {items.map((log, i) => (
              <tr key={log.id || i} className="border-t border-gray-200 dark:border-gray-800">
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                  {log.horse?.name || '—'}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeColor(log.type)}`}>
                    {typeLabel(log.type)}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{log.title}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{log.date_performed}</td>
                <td className="px-3 py-2">
                  {log.next_due_date ? (
                    <span className={new Date(log.next_due_date) < new Date() ? 'font-semibold text-red-600' : 'text-gray-600 dark:text-gray-400'}>
                      {log.next_due_date}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{log.provider_name || '—'}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                  {log.cost != null ? `SAR ${Number(log.cost).toFixed(0)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default AdminMaintenancePage;
