import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineDocumentDownload, HiOutlineClipboardCopy, HiOutlineExternalLink, HiOutlineCheckCircle } from 'react-icons/hi';
import { PROVIDER_ENDPOINTS } from '../constants/apiEndpoints';

export default function ApiDocumentation() {
    const navigate = useNavigate();
    const [expandedProvider, setExpandedProvider] = useState(null);
    const [copyFeedback, setCopyFeedback] = useState(null);

    const baseUrl = window.location.origin;

    const handleCopy = (url) => {
        navigator.clipboard.writeText(url);
        setCopyFeedback(url);
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
            <div className="flex justify-between items-center bg-slate-800/20 p-6 rounded-2xl border border-slate-700/50">
                <div>
                    <h2 className="text-2xl font-bold text-white">API Integration Directory</h2>
                    <p className="text-slate-400 text-sm mt-1">Ready-to-use endpoints for your technical integration teams.</p>
                </div>
                <button
                    onClick={() => navigate('/docs/export')}
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
        </div>
    );
}
