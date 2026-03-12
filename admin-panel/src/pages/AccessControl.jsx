import { useState, useEffect } from 'react';
import api from '../services/api';
import { HiKey, HiClock, HiGlobeAlt, HiOutlineLightningBolt, HiCheckCircle } from 'react-icons/hi';
import { PROVIDER_ENDPOINTS } from '../constants/apiEndpoints';

export default function AccessControl() {
    const [clients, setClients] = useState([]);
    const [accesses, setAccesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [ipInput, setIpInput] = useState('');

    const [formData, setFormData] = useState({
        clientId: '', providerName: 'SportRadar', endpoints: [],
        validFrom: '', validUntil: '', whitelistedIPs: [],
        requestLimitPerSecond: -1, status: 'active'
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cRes, aRes] = await Promise.all([api.get('/clients'), api.get('/access')]);
            setClients(cRes.data || []);
            setAccesses(aRes.data || []);
        } finally { setLoading(false); }
    };

    const handleAddIp = () => {
        if (ipInput.trim() && !formData.whitelistedIPs.includes(ipInput.trim())) {
            setFormData(p => ({ ...p, whitelistedIPs: [...p.whitelistedIPs, ipInput.trim()] }));
            setIpInput('');
        }
    };

    const handleRemoveIp = (ip) => setFormData(p => ({ ...p, whitelistedIPs: p.whitelistedIPs.filter(i => i !== ip) }));

    const openForm = (acc = null) => {
        if (acc) {
            setEditId(acc._id);
            setFormData({
                ...acc,
                clientId: acc.clientId._id || acc.clientId,
                validFrom: new Date(acc.validFrom).toISOString().slice(0, 16),
                validUntil: new Date(acc.validUntil).toISOString().slice(0, 16),
                endpoints: acc.endpoints || []
            });
        } else {
            setEditId(null);
            const now = new Date(); const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
            setFormData({
                clientId: clients[0]?._id || '', providerName: 'SportRadar', endpoints: [],
                validFrom: now.toISOString().slice(0, 16), validUntil: nextMonth.toISOString().slice(0, 16),
                whitelistedIPs: [], requestLimitPerSecond: -1, status: 'active'
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) await api.put(`/access/${editId}`, formData);
            else await api.post('/access', formData);
            setShowModal(false);
            fetchData();
        } catch (error) { alert('Validation failed. Make sure unique provider rule.'); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Revoke access fully?')) {
            await api.delete(`/access/${id}`);
            fetchData();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Firewall Policies</h2>
                <button onClick={() => openForm()} className="btn-primary"><HiKey /> Deploy Rule</button>
            </div>

            {loading ? <div className="text-slate-400 p-8">Loading rules...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accesses.map(acc => (
                        <div key={acc._id} className="card-hoverable p-6 relative group flex flex-col">
                            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-lg ${acc.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                {acc.status.toUpperCase()}
                            </div>
                            <div className="mb-4">
                                <h3 className="text-lg font-bold">{acc.clientId?.name || 'Unknown'}</h3>
                                <p className="text-brand-accent font-semibold text-sm">{acc.providerName}</p>
                            </div>
                            <div className="space-y-2 mb-6 text-sm flex-1">
                                <p className="flex items-center gap-2"><HiGlobeAlt className="text-slate-500" /> IP: {acc.whitelistedIPs?.length ? acc.whitelistedIPs.join(', ') : 'PUBLIC APP'}</p>
                                <p className="flex items-center gap-2"><HiCheckCircle className="text-slate-500" /> Routes: {acc.endpoints?.length ? `${acc.endpoints.length} Active` : 'None Assigned'}</p>
                                <p className="flex items-center gap-2"><HiClock className="text-slate-500" /> Till: {new Date(acc.validUntil).toLocaleDateString()}</p>
                            </div>
                            <div className="flex justify-between border-t border-slate-700/50 pt-3">
                                <button onClick={() => handleDelete(acc._id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                                <button onClick={() => openForm(acc)} className="btn-secondary text-xs py-1 px-3">Edit</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="bg-brand-panel w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-slate-700 my-8">
                        <h3 className="text-xl font-bold mb-6 border-b border-slate-700 pb-2">Modify Security Context</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-sm text-slate-400">Client</label><select className="input-field" value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })}>{clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
                            <div><label className="text-sm text-slate-400">Provider Region</label><select className="input-field" value={formData.providerName} onChange={e => setFormData({ ...formData, providerName: e.target.value, endpoints: [] })}><option>SportRadar</option><option>Betfair</option><option>SkyExchange</option><option>The100exch</option></select></div>
                            <div><label className="text-sm text-slate-400">Valid Start</label><input type="datetime-local" className="input-field" required value={formData.validFrom} onChange={e => setFormData({ ...formData, validFrom: e.target.value })} /></div>
                            <div><label className="text-sm text-slate-400">Expiry End</label><input type="datetime-local" className="input-field" required value={formData.validUntil} onChange={e => setFormData({ ...formData, validUntil: e.target.value })} /></div>
                        </div>

                        <div className="mt-6">
                            <label className="text-sm text-slate-400 block mb-2">Assign API Endpoints ({formData.providerName})</label>
                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 max-h-48 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
                                {PROVIDER_ENDPOINTS[formData.providerName]?.map(ep => (
                                    <label key={ep.id} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors group">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-600 text-brand-accent focus:ring-brand-accent bg-slate-800"
                                            checked={formData.endpoints.includes(ep.id)}
                                            onChange={(e) => {
                                                const newEndpoints = e.target.checked
                                                    ? [...formData.endpoints, ep.id]
                                                    : formData.endpoints.filter(id => id !== ep.id);
                                                setFormData({ ...formData, endpoints: newEndpoints });
                                            }}
                                        />
                                        <span className="text-sm text-slate-300 group-hover:text-white">{ep.label}</span>
                                    </label>
                                ))}
                                {(!PROVIDER_ENDPOINTS[formData.providerName] || PROVIDER_ENDPOINTS[formData.providerName].length === 0) && (
                                    <div className="col-span-2 text-center text-slate-500 py-4 italic">No specific endpoints defined for this provider.</div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                            <div className="flex items-center gap-2 text-emerald-400">
                                <HiOutlineLightningBolt className="w-5 h-5" />
                                <span className="font-bold text-sm">Security Policy: Whitelist Only</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Rate limiting is disabled by default. Security is enforced strictly via the IP Whitelist below.</p>
                        </div>
                        <div className="mt-4">
                            <label className="text-sm">Whitelisted IPs</label>
                            <div className="flex gap-2 mb-2">
                                <input className="input-field" value={ipInput} onChange={e => setIpInput(e.target.value)} placeholder="0.0.0.0" />
                                <button type="button" onClick={handleAddIp} className="btn-secondary">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2">{formData.whitelistedIPs.map(ip => <span key={ip} className="bg-brand-accent/30 px-2 py-1 rounded text-sm text-white" onClick={() => handleRemoveIp(ip)}>{ip} x</span>)}</div>
                        </div>
                        <div className="flex gap-3 justify-end mt-6"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Provision API Gateway</button></div>
                    </form>
                </div>
            )}
        </div>
    );
}
