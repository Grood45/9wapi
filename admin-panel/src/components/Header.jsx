import { useLocation } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineBell } from 'react-icons/hi';

export default function Header() {
    const location = useLocation();

    const getPageTitle = () => {
        switch (location.pathname) {
            case '/': return 'Dashboard Overview';
            case '/clients': return 'Client Management';
            case '/access': return 'API Access Firewall';
            case '/ledger': return 'Financial Ledger';
            case '/settings': return 'System Settings';
            default: return 'Admin Portal';
        }
    };

    return (
        <header className="h-16 bg-brand-dark/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0">
            <div>
                <h1 className="text-xl font-bold text-white tracking-tight">{getPageTitle()}</h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search configurations..."
                        className="bg-slate-900 border border-slate-700 rounded-full pl-9 pr-4 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all w-64 placeholder:text-slate-500"
                    />
                </div>

                <button className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800">
                    <HiOutlineBell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-brand-dark"></span>
                </button>
            </div>
        </header>
    );
}
