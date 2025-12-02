
import React, { useState } from 'react';
import Navigation from './components/Navigation';
import KinematicSimulation from './components/KinematicSimulation';
import BomView from './components/BomView';
import { Tab } from './types';
import { EXECUTIVE_SUMMARY, KEY_FEATURES, SPECS_DATA } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.OVERVIEW);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.OVERVIEW:
        return (
            <div className="space-y-8 animate-fade-in">
                 {/* Hero Section */}
                 <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-2xl p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600 opacity-10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500 opacity-10 rounded-full -ml-10 -mb-10 blur-3xl"></div>
                    
                    <div className="relative z-10 max-w-3xl">
                        <div className="inline-flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-mono mb-4 border border-slate-700">
                             <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                             PRODUCTION READY
                        </div>
                        <h1 className="text-5xl font-extrabold mb-6 tracking-tight leading-tight">Nexus-9 Humanoid <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">Single Arm</span></h1>
                        <p className="text-xl text-slate-300 mb-8 font-light leading-relaxed">
                            Precision engineering meets open-source accessibility. An advanced 9-DOF redundant manipulator designed for high-payload adaptability and safe human-robot interaction.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setActiveTab(Tab.KINEMATICS)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold transition shadow-lg shadow-blue-900/50 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Launch Simulation
                            </button>
                            <button onClick={() => setActiveTab(Tab.SPECS)} className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-bold backdrop-blur transition border border-white/20">
                                View Specifications
                            </button>
                        </div>
                    </div>
                 </div>

                 {/* Key Features Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {KEY_FEATURES.map((feature, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={feature.icon}></path></svg>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">{feature.title}</h3>
                            <p className="text-gray-900 text-xl font-bold mt-1">{feature.value}</p>
                        </div>
                    ))}
                 </div>

                 {/* Executive Summary */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-1 h-8 bg-blue-600 rounded-full"></span>
                        Executive Summary
                     </h2>
                     <div className="prose prose-lg max-w-none text-gray-600">
                         <div dangerouslySetInnerHTML={{ __html: EXECUTIVE_SUMMARY.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                     </div>
                 </div>
            </div>
        );
      case Tab.SPECS:
        return (
             <div className="space-y-8 animate-fade-in">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Technical Specifications</h2>
                            <p className="text-gray-500 mt-1">Detailed hardware and performance requirements for Nexus-9.</p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Download PDF
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-8">
                        {SPECS_DATA.map((section, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    {section.category}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                                    {section.items.map((item, i) => (
                                        <div key={i} className="flex flex-col">
                                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{item.label}</span>
                                            <span className="text-sm font-semibold text-gray-900 border-l-2 border-gray-300 pl-3">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
        );
      case Tab.KINEMATICS:
        return <KinematicSimulation />;
      case Tab.BOM:
        return (
            <div className="space-y-6 animate-fade-in">
                <BomView />
            </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-800">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {renderContent()}
      </main>
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
                Nexus Robotics Labs • Open Source Initiative
            </p>
            <div className="flex gap-4 text-sm text-gray-400">
                <span>v1.2.0-stable</span>
                <span>•</span>
                <span>React 18</span>
                <span>•</span>
                <span>Tailwind CSS</span>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
