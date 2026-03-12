import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Ledger() {
    const [ledgers, setLedgers] = useState([]);
    const [clients, setClients] = useState([]);
    const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ clientId: '', expectedAmount: 0, collectedAmount: 0 });
    const [editMode, setEditMode] = useState(false);

    useEffect(() => { loadData(); }, [monthFilter]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [lRes, cRes] = await Promise.all([
                api.get(`/ledgers?monthYear=${monthFilter}`),
                api.get('/clients')
            ]);
            setLedgers(lRes.data || []);
            setClients(cRes.data || []);
        } finally { setLoading(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = { ...formData, monthYear: monthFilter };
        if (editMode) await api.put(`/ledgers/${formData.clientId}/${monthFilter}`, payload);
        else await api.post('/ledgers', payload);
        setShowModal(false);
        loadData();
    };

    const openForm = (ledger = null) => {
        if (ledger) {
            setEditMode(true);
            setFormData({ clientId: ledger.clientId._id, expectedAmount: ledger.expectedAmount, collectedAmount: ledger.collectedAmount });
        } else {
            setEditMode(false);
            setFormData({ clientId: clients[0]?._id || '', expectedAmount: 0, collectedAmount: 0 });
        }
        setShowModal(true);
    };

    const getStatusStr = (exp, col) => {
        if (exp === 0) return { text: 'NO DUES', color: 'bg-slate-500/20 text-slate-400' };
        if (col >= exp) return { text: 'PAID', color: 'bg-green-500/20 text-green-400' };
        if (col > 0) return { text: 'PARTIAL', color: 'bg-amber-500/20 text-amber-400' };
        return { text: 'PENDING', color: 'bg-red-500/20 text-red-400' };
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Billing Ledger</h2>
                <div className="flex gap-4">
                    <input type="month" className="input-field w-auto" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
                    <button onClick={() => openForm()} className="btn-primary">Log Payment</button>
                </div>
            </div>

            {loading ? <div className="p-8 text-slate-400 text-center">Loading Billing Data...</div> :
                <div className="card-panel overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Client</th>
                                <th className="px-6 py-4 font-semibold text-right">Expected (₹)</th>
                                <th className="px-6 py-4 font-semibold text-right">Collected (₹)</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {ledgers.map(l => {
                                const stat = getStatusStr(l.expectedAmount, l.collectedAmount);
                                return (
                                    <tr key={l._id} className="hover:bg-slate-800/40">
                                        <td className="px-6 py-4 font-medium text-white">{l.clientId?.name || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-right">{l.expectedAmount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-emerald-400 text-right font-bold">{l.collectedAmount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${stat.color}`}>{stat.text}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => openForm(l)} className="text-brand-accent hover:text-white transition">Update</button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {ledgers.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-slate-500">No ledgers generated for {monthFilter}.</td></tr>}
                        </tbody>
                    </table>
                </div>
            }

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <form onSubmit={handleSave} className="bg-brand-panel w-full max-w-md rounded-2xl p-6 border border-slate-700">
                        <h3 className="text-xl font-bold mb-4">{editMode ? 'Update Ledger' : 'Create Ledger Entry'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Client</label>
                                <select required disabled={editMode} className="input-field" value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })}>
                                    {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Expected Monthly Due (₹)</label>
                                <input type="number" required className="input-field" value={formData.expectedAmount} onChange={e => setFormData({ ...formData, expectedAmount: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-sm text-emerald-400 mb-1">Collected (₹)</label>
                                <input type="number" required className="input-field" value={formData.collectedAmount} onChange={e => setFormData({ ...formData, collectedAmount: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-6">
                            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                            <button type="submit" className="btn-primary">Save Ledger</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
