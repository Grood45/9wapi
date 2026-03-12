import { useState, useEffect } from 'react';
import api from '../services/api';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ name: '', domainName: '', contactNumber: '', status: 'active', monthlyAgreementAmount: '' });

    useEffect(() => { loadClients(); }, []);

    const loadClients = async () => {
        const res = await api.get('/clients');
        setClients(res.data || []);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editId) await api.put(`/clients/${editId}`, formData);
            else await api.post('/clients', formData);
            setShowModal(false);
            loadClients();
        } catch (error) {
            alert(error.message || 'Operation failed.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete client permanently?')) {
            await api.delete(`/clients/${id}`);
            loadClients();
        }
    };

    const openForm = (c = null) => {
        if (c) {
            setEditId(c._id);
            setFormData({ name: c.name, domainName: c.domainName || '', contactNumber: c.contactNumber, status: c.status, monthlyAgreementAmount: '' });
        } else {
            setEditId(null);
            setFormData({ name: '', domainName: '', contactNumber: '', status: 'active', monthlyAgreementAmount: '' });
        }
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Client Directory</h2>
                <button onClick={() => openForm()} className="btn-primary">
                    <HiPlus className="w-5 h-5" /> Add Client
                </button>
            </div>

            <div className="card-panel overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                        <tr>
                            <th className="px-6 py-4 font-semibold rounded-tl-xl">Client Name</th>
                            <th className="px-6 py-4 font-semibold">Domain</th>
                            <th className="px-6 py-4 font-semibold">Financials (₹)</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {clients.map(c => (
                            <tr key={c._id} className="hover:bg-slate-800/40 transition-colors group">
                                <td className="px-6 py-4 font-medium text-white">
                                    <div>{c.name}</div>
                                    <div className="text-xs text-slate-500 font-normal">{c.contactNumber}</div>
                                </td>
                                <td className="px-6 py-4 text-brand-accent text-xs">{c.domainName || '-'}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="text-xs flex justify-between gap-4">
                                            <span className="text-slate-500 italic">Revenue:</span>
                                            <span className="text-emerald-400 font-bold">₹{c.revenueStats?.totalCollected?.toLocaleString() || 0}</span>
                                        </div>
                                        <div className="text-xs flex justify-between gap-4">
                                            <span className="text-slate-500 italic">Dues:</span>
                                            <span className="text-amber-500 font-bold">₹{c.revenueStats?.pendingBalance?.toLocaleString() || 0}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${c.status === 'active' ? 'bg-green-500/20 text-green-400' : c.status === 'suspended' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                        {c.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => openForm(c)} className="p-2 text-slate-400 hover:text-brand-accent transition-colors"><HiPencil /></button>
                                    <button onClick={() => handleDelete(c._id)} className="p-2 text-slate-400 hover:text-red-400 transition-colors"><HiTrash /></button>
                                </td>
                            </tr>
                        ))}
                        {clients.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-slate-500">No clients registered.</td></tr>}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <form onSubmit={handleSave} className="bg-brand-panel w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in border border-slate-700">
                        <h3 className="text-xl font-bold mb-4">{editId ? 'Edit Client' : 'New Client'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Company / Name</label>
                                <input required className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Target Domain URL</label>
                                <input className="input-field" placeholder="ex: 9wicket.com" value={formData.domainName} onChange={e => setFormData({ ...formData, domainName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Contact Phone</label>
                                <input className="input-field" value={formData.contactNumber} onChange={e => setFormData({ ...formData, contactNumber: e.target.value })} />
                            </div>
                            {!editId && (
                                <div className="p-3 bg-brand-accent/10 border border-brand-accent/30 rounded-lg">
                                    <label className="block text-sm text-brand-accent font-bold mb-1">Monthly Billing Agreement (₹)</label>
                                    <input type="number" className="input-field border-brand-accent/50 focus:border-brand-accent" placeholder="0 = Skip Auto Ledger" value={formData.monthlyAgreementAmount} onChange={e => setFormData({ ...formData, monthlyAgreementAmount: e.target.value })} />
                                    <p className="text-xs text-brand-accent/80 mt-1">Automatically generates the first ledger invoice.</p>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Status</label>
                                <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-6">
                            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                            <button type="submit" className="btn-primary">Save Client</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
