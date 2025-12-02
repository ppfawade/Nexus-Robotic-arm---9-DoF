
import React from 'react';
import { Tab } from '../types';

interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="font-bold text-2xl text-slate-900 tracking-tight">NEXUS <span className="text-blue-600 font-normal">LABS</span></span>
            </div>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-4 items-center">
              {Object.values(Tab).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors duration-200`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center">
             <span className="text-xs text-gray-400 font-mono hidden md:block">NEXUS-9 PROTOTYPE-REV-A</span>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      <div className="sm:hidden flex overflow-x-auto pb-2 px-4 gap-2 no-scrollbar">
         {Object.values(Tab).map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border ${
                    activeTab === tab ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
            >
                {tab}
            </button>
         ))}
      </div>
    </nav>
  );
};

export default Navigation;
