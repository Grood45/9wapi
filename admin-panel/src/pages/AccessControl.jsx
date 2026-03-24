import { useState, useEffect } from 'react';
import api from '../services/api';
import { HiKey, HiClock, HiGlobeAlt, HiOutlineLightningBolt, HiCheckCircle, HiChevronDown, HiChevronUp, HiPlus, HiTrash } from 'react-icons/hi';
import { PROVIDER_ENDPOINTS } from '../constants/apiEndpoints';

const ALL_PROVIDERS = ['SkyExchange', 'KingExchange', 'Betfair', 'SportRadar', 'The100exch', 'Gman', 'D247'];

export default function AccessControl() {
    const [clients, setClients] = useState([]);
    const [accessData, setAccessData] = useState([]); // Array of { client, rules: [] }
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Form State
    const [selectedClientId, setSelectedClientId] = useState('');
    const [validFrom, setValidFrom] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [whitelistedIPs, setWhitelistedIPs] = useState([]);
    const [ipInput, setIpInput] = useState('');
    const [domains, setDomains] = useState([]);
    const [domainInput, setDomainInput] = useState('');
    const [activeProviders, setActiveProviders] = useState({}); // { 'SkyExchange': { enabled: true, endpoints: [] } }

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cRes, aRes] = await Promise.all([api.get('/clients'), api.get('/access')]);
            setClients(cRes.data || []);
            
            // Group by Client
            const grouped = {};
            (aRes.data || []).forEach(acc => {
                const cid = acc.clientId?._id || acc.clientId;
                if (!grouped[cid]) grouped[cid] = { client: acc.clientId, rules: [] };
                grouped[cid].rules.push(acc);
            });
            setAccessData(Object.values(grouped));
        } finally { setLoading(false); }
    };

    const openModal = (clientGroup = null) => {
        const now = new Date();
        const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);

        if (clientGroup) {
            const firstRule = clientGroup.rules[0];
            setSelectedClientId(clientGroup.client._id);
            setValidFrom(new Date(firstRule.validFrom).toISOString().slice(0, 16));
            setValidUntil(new Date(firstRule.validUntil).toISOString().slice(0, 16));
            setWhitelistedIPs(firstRule.whitelistedIPs || []);
            setDomains(firstRule.domains || []);
            
            const providersMap = {};
            clientGroup.rules.forEach(r => {
                providersMap[r.providerName] = { enabled: true, endpoints: r.endpoints || [] };
            });
            setActiveProviders(providersMap);
        } else {
            setSelectedClientId(clients[0]?._id || '');
            setValidFrom(now.toISOString().slice(0, 16));
            setValidUntil(nextMonth.toISOString().slice(0, 16));
            setWhitelistedIPs([]);
            setDomains([]);
            setActiveProviders({});
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                providers: Object.entries(activeProviders)
                    .filter(([name, config]) => config.enabled)
                    .map(([name, config]) => ({
                        providerName: name,
                        endpoints: config.endpoints,
                        validFrom,
                        validUntil,
                        whitelistedIPs,
                        domains,
                        status: 'active'
                    }))
            };
            
            await api.post(`/access/sync/${selectedClientId}`, payload);
            setShowModal(false);
            fetchData();
        } catch (error) {
            alert('Operation failed. Check if client selection is correct.');
        }
    };

    const toggleProvider = (name) => {
        setActiveProviders(prev => ({
            ...prev,
            [name]: {
                enabled: !prev[name]?.enabled,
                endpoints: prev[name]?.endpoints || []
            }
        }));
    };

    const toggleEndpoint = (providerName, endpointId) => {
        setActiveProviders(prev => {
            const current = prev[providerName] || { enabled: true, endpoints: [] };
            const endpoints = current.endpoints.includes(endpointId)
                ? current.endpoints.filter(id => id !== endpointId)
                : [...current.endpoints, endpointId];
            return { ...prev, [providerName]: { ...current, endpoints } };
        });
    };

    const addIp = () => {
        if (ipInput.trim() && !whitelistedIPs.includes(ipInput.trim())) {
            setWhitelistedIPs([...whitelistedIPs, ipInput.trim()]);
            setIpInput('');
        }
    };

    const addDomain = () => {
        if (domainInput.trim() && !domains.includes(domainInput.trim())) {
            setDomains([...domains, domainInput.trim()]);
            setDomainInput('');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Firewall Policies</h2>
                <button onClick={() => openModal()} className="btn-primary flex items-center gap-2"><HiPlus /> New Policy</button>
            </div>

            {loading ? <div className="text-slate-400 p-8">Loading policies...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accessData.map(group => (
                        <div key={group.client?._id} className="card-hoverable p-6 border-l-4 border-brand-accent">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold">{group.client?.name || 'Unknown Client'}</h3>
                                    <p className="text-xs text-slate-500">ID: {group.client?._id}</p>
                                </div>
                                <div className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-[10px] font-bold">PROTECTED</div>
                            </div>
                            
                            <div className="space-y-3 mb-6 flex-1 text-sm">
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500">Active Providers</p>
                                    <div className="flex flex-wrap gap-1">
                                        {group.rules.map(r => (
                                            <span key={r.providerName} className="bg-slate-800 text-brand-accent px-2 py-0.5 rounded text-[10px] font-bold border border-brand-accent/20">
                                                {r.providerName}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <p className="flex items-center gap-2"><HiGlobeAlt className="text-slate-500" /> {group.rules[0].whitelistedIPs?.length} IPs whitelisted</p>
                                <p className="flex items-center gap-2"><HiClock className="text-slate-500" /> Exp: {new Date(group.rules[0].validUntil).toLocaleDateString()}</p>
                            </div>

                            <button onClick={() => openModal(group)} className="w-full btn-secondary text-xs py-2">Modify Security Context</button>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="bg-brand-panel w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-slate-700 my-8">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-2">
                            <h3 className="text-xl font-bold">Modify Security Context</h3>
                            <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        {/* Top Level Config */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Client</label>
                                <select className="input-field" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                                    {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Valid Start</label>
                                    <input type="datetime-local" className="input-field text-xs" required value={validFrom} onChange={e => setValidFrom(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Valid Until</label>
                                    <input type="datetime-local" className="input-field text-xs" required value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Providers & Endpoints */}
                        <div className="space-y-4 mb-6">
                            <label className="text-xs text-slate-400 font-bold uppercase block">Provider Matrix & API Entitlements</label>
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                {ALL_PROVIDERS.map(pName => {
                                    const isActive = activeProviders[pName]?.enabled;
                                    return (
                                        <div key={pName} className={`border rounded-xl transition-all ${isActive ? 'border-brand-accent/50 bg-brand-accent/5' : 'border-slate-800 bg-slate-900/50'}`}>
                                            <div onClick={() => toggleProvider(pName)} className="flex items-center justify-between p-3 cursor-pointer select-none">
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox" checked={!!isActive} readOnly className="w-4 h-4 rounded text-brand-accent bg-slate-800 border-slate-700" />
                                                    <span className={`font-bold text-sm ${isActive ? 'text-brand-accent' : 'text-slate-500'}`}>{pName}</span>
                                                </div>
                                                {isActive ? <HiChevronUp className="text-slate-500" /> : <HiChevronDown className="text-slate-500" />}
                                            </div>
                                            
                                            {isActive && (
                                                <div className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 gap-2 border-t border-slate-700/30 mt-1">
                                                    {PROVIDER_ENDPOINTS[pName]?.map(ep => (
                                                        <label key={ep.id} className="flex items-center gap-2 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors group">
                                                            <input
                                                                type="checkbox"
                                                                className="w-3.5 h-3.5 rounded text-brand-accent bg-slate-900 border-slate-700"
                                                                checked={activeProviders[pName]?.endpoints.includes(ep.id)}
                                                                onChange={() => toggleEndpoint(pName, ep.id)}
                                                            />
                                                            <span className="text-xs text-slate-300 group-hover:text-white truncate" title={ep.description}>{ep.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* IP Whitelist */}
                        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 mb-4">
                            <div className="flex items-center gap-2 text-emerald-400 mb-3">
                                <HiOutlineLightningBolt className="w-4 h-4" />
                                <span className="font-bold text-xs uppercase tracking-wider">IP Security Whitelist</span>
                            </div>
                            <div className="flex gap-2 mb-3">
                                <input className="input-field text-xs py-2" value={ipInput} onChange={e => setIpInput(e.target.value)} placeholder="Enter IP (e.g. 104.21.x.x)" onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addIp())} />
                                <button type="button" onClick={addIp} className="btn-secondary text-xs px-4">Add IP</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {whitelistedIPs.map(ip => (
                                    <span key={ip} className="bg-brand-accent/20 border border-brand-accent/30 px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 group">
                                        {ip}
                                        <button type="button" onClick={() => setWhitelistedIPs(whitelistedIPs.filter(i => i !== ip))} className="text-slate-400 hover:text-red-400 transition-colors">✕</button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Domain Whitelist */}
                        <div className="bg-slate-900/80 p-4 rounded-xl border border-blue-500/30">
                            <div className="flex items-center gap-2 text-blue-400 mb-3">
                                <HiGlobeAlt className="w-4 h-4" />
                                <span className="font-bold text-xs uppercase tracking-wider">Domain Whitelist [FOR STREAMING]</span>
                            </div>
                            <div className="flex gap-2 mb-3">
                                <input className="input-field text-xs py-2" value={domainInput} onChange={e => setDomainInput(e.target.value)} placeholder="Enter Domain (e.g. 9x.live)" onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addDomain())} />
                                <button type="button" onClick={addDomain} className="btn-secondary text-xs px-4 text-blue-400 border-blue-500/20">Add </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {domains.map(d => (
                                    <span key={d} className="bg-blue-500/20 border border-blue-500/30 px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 group">
                                        {d}
                                        <button type="button" onClick={() => setDomains(domains.filter(i => i !== d))} className="text-slate-400 hover:text-red-400 transition-colors">✕</button>
                                    </span>
                                ))}
                            </div>
                            {activeProviders['D247']?.enabled && domains.length === 0 && (
                                <p className="text-[10px] text-amber-400 mt-2 italic font-bold">⚠️ DiamondTV is active. At least one domain is recommended for streaming.</p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-slate-700">
                            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-sm px-6">Cancel</button>
                            <button type="submit" className="btn-primary text-sm px-6">Provision Security Context</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
