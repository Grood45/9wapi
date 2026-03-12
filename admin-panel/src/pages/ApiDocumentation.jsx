import { useState } from 'react';
import { HiOutlineDocumentDownload, HiOutlineClipboardCopy, HiOutlineExternalLink, HiOutlineCheckCircle, HiOutlineExclamation } from 'react-icons/hi';
import { PROVIDER_ENDPOINTS } from '../constants/apiEndpoints';
import { generateIntegrationPdf } from '../utils/pdfExporter';

export default function ApiDocumentation() {
    const [expandedProvider, setExpandedProvider] = useState(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedEndpoints, setSelectedEndpoints] = useState({}); // { Provider: [ids] }
    const [copyFeedback, setCopyFeedback] = useState(null);

    const baseUrl = window.location.origin;

    const handleCopy = (url) => {
        navigator.clipboard.writeText(url);
        setCopyFeedback(url);
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    const toggleSelection = (provider, endpointId) => {
        const current = selectedEndpoints[provider] || [];
        const updated = current.includes(endpointId)
            ? current.filter(id => id !== endpointId)
            : [...current, endpointId];

        setSelectedEndpoints({ ...selectedEndpoints, [provider]: updated });
    };

    const handleExport = () => {
        const dataToExport = {};
        Object.keys(selectedEndpoints).forEach(p => {
            if (selectedEndpoints[p].length > 0) {
                dataToExport[p] = PROVIDER_ENDPOINTS[p].filter(ep => selectedEndpoints[p].includes(ep.id));
            }
        });

        if (Object.keys(dataToExport).length === 0) {
            alert('Please select at least one endpoint to export.');
            return;
        }

        generateIntegrationPdf(dataToExport);
        setShowExportModal(false);
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
            <div className="flex justify-between items-center bg-slate-800/20 p-6 rounded-2xl border border-slate-700/50">
                <div>
                    <h2 className="text-2xl font-bold text-white">API Integration Directory</h2>
                    <p className="text-slate-400 text-sm mt-1">Ready-to-use endpoints for your technical integration teams.</p>
                </div>
                <button
                    onClick={() => {
                        // Initialize with all checked if empty
                        if (Object.keys(selectedEndpoints).length === 0) {
                            const initial = {};
                            Object.keys(PROVIDER_ENDPOINTS).forEach(p => initial[p] = PROVIDER_ENDPOINTS[p].map(e => e.id));
                            setSelectedEndpoints(initial);
                        }
                        setShowExportModal(true);
                    }}
                    className="btn-primary flex items-center gap-2"
                >
                    <HiOutlineDocumentDownload className="w-5 h-5" /> Download PDF Guide
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(PROVIDER_ENDPOINTS).map((provider) => (
                    <div key={provider} className={`card-panel overflow-hidden transition-all duration-300 border-l-4 ${expandedProvider === provider ? 'border-l-brand-accent h-auto' : 'border-l-slate-700 h-24'}`}>
                        <div
                            onClick={() => setExpandedProvider(expandedProvider === provider ? null : provider)}
                            className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-800/30 transition-colors"
                        >
                            <div>
                                <h3 className="text-xl font-bold text-white">{provider}</h3>
                                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-semibold">{PROVIDER_ENDPOINTS[provider].length} Active Endpoints</p>
                            </div>
                            <HiOutlineExternalLink className={`w-6 h-6 text-slate-500 transition-transform ${expandedProvider === provider ? 'rotate-90 text-brand-accent' : ''}`} />
                        </div>

                        {expandedProvider === provider && (
                            <div className="px-6 pb-6 space-y-4 border-t border-slate-700/50 pt-4 bg-slate-900/40">
                                {PROVIDER_ENDPOINTS[provider].map((ep) => (
                                    <div key={ep.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/40 hover:border-brand-accent/30 transition-all group">
                                        <div className="flex justify-between items-start gap-4 mb-2">
                                            <div>
                                                <h4 className="font-bold text-slate-100">{ep.label}</h4>
                                                <p className="text-xs text-slate-500 mt-1 italic">{ep.description}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCopy(`${baseUrl}${ep.pathTemplate}`)}
                                                    className="p-2 bg-slate-700 hover:bg-brand-accent rounded-lg text-white transition-colors title='Copy URL'"
                                                >
                                                    {copyFeedback === `${baseUrl}${ep.pathTemplate}` ? <HiOutlineCheckCircle className="w-4 h-4" /> : <HiOutlineClipboardCopy className="w-4 h-4" />}
                                                </button>
                                                <a
                                                    href={`${baseUrl}${ep.pathTemplate}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 bg-slate-700 hover:bg-emerald-500 rounded-lg text-white transition-colors title='Test API'"
                                                >
                                                    <HiOutlineExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                        <div className="bg-black/40 p-2 rounded font-mono text-[10px] text-brand-accent break-all leading-relaxed">
                                            {baseUrl}{ep.pathTemplate}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Selection Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-brand-panel w-full max-w-xl rounded-2xl p-8 border border-slate-700 shadow-2xl animate-slide-up">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-brand-accent/20 rounded-xl text-brand-accent">
                                <HiOutlineDocumentDownload className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Configure Integration Guide</h3>
                                <p className="text-slate-400 text-sm">Select exactly which APIs to include in the PDF manual.</p>
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                            {Object.keys(PROVIDER_ENDPOINTS).map(p => (
                                <div key={p} className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                                        <h4 className="font-bold text-brand-accent tracking-wide">{p.toUpperCase()}</h4>
                                        <button
                                            onClick={() => {
                                                const all = PROVIDER_ENDPOINTS[p].map(e => e.id);
                                                const current = selectedEndpoints[p] || [];
                                                setSelectedEndpoints({ ...selectedEndpoints, [p]: current.length === all.length ? [] : all });
                                            }}
                                            className="text-[10px] text-slate-500 hover:text-white underline transition-colors"
                                        >
                                            Toggle All
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {PROVIDER_ENDPOINTS[p].map(ep => (
                                            <label key={ep.id} className="flex items-center gap-3 p-3 bg-slate-800/40 hover:bg-slate-700/60 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-600">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-600 text-brand-accent focus:ring-brand-accent bg-slate-800"
                                                    checked={selectedEndpoints[p]?.includes(ep.id)}
                                                    onChange={() => toggleSelection(p, ep.id)}
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-200">{ep.label}</p>
                                                    <p className="text-[10px] text-slate-500">{ep.id}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-8 pt-6 border-t border-slate-700">
                            <button onClick={() => setShowExportModal(false)} className="flex-1 py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all">
                                Cancel
                            </button>
                            <button onClick={handleExport} className="flex-1 py-3 px-6 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold rounded-xl shadow-lg shadow-brand-accent/20 transition-all flex items-center justify-center gap-2">
                                <HiOutlineDocumentDownload className="w-5 h-5" /> Generate Guide
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
