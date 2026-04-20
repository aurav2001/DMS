import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = ({ crumbs, onNavigate }) => {
    return (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto py-2 scrollbar-none">
            <button 
                onClick={() => onNavigate('root', 'My Documents')}
                className="flex items-center gap-1.5 text-slate-500 hover:text-primary-600 transition-colors whitespace-nowrap"
            >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">My Documents</span>
            </button>
            
            {crumbs.map((crumb, index) => (
                <React.Fragment key={crumb._id}>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <button 
                        onClick={() => onNavigate(crumb._id, crumb.name)}
                        className={`text-sm font-medium whitespace-nowrap transition-colors ${
                            index === crumbs.length - 1 
                                ? 'text-primary-600 cursor-default' 
                                : 'text-slate-500 hover:text-primary-600'
                        }`}
                    >
                        {crumb.name}
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
};

export default Breadcrumbs;
