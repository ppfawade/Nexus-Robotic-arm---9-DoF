import React, { useState } from 'react';
import { analyzeRisk } from '../services/geminiService';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const AnalysisView: React.FC = () => {
  const [fmeaContext, setFmeaContext] = useState("Sudden power loss during maximum payload extension");
  const [generatedRisk, setGeneratedRisk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const data = [
    { name: 'Shoulder Y', stress: 85, temp: 60, reliability: 98 },
    { name: 'Elbow Y', stress: 65, temp: 45, reliability: 99 },
    { name: 'Wrist Z', stress: 30, temp: 35, reliability: 99.5 },
  ];

  const handleRiskAnalysis = async () => {
    setLoading(true);
    const result = await analyzeRisk(fmeaContext);
    setGeneratedRisk(result);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Charts Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Worst Case Analysis (WCA) & Reliability</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="stress" name="Mech Stress (%)" fill="#ef4444" />
              <Bar dataKey="temp" name="Temp (°C)" fill="#f59e0b" />
              <Bar dataKey="reliability" name="MTTF Index" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-500 mt-4 italic">
            * Data based on worst-case load (5kg) at full extension (900mm). Joint 2 (Shoulder Y) shows highest stress concentration.
        </p>
      </div>

      {/* AI FMEA Generator */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
             <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
             </div>
             <h3 className="text-lg font-bold text-gray-800">Dynamic FMEA Generator</h3>
        </div>
        
        <div className="flex gap-4 mb-4">
            <input 
                type="text" 
                value={fmeaContext}
                onChange={(e) => setFmeaContext(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Describe a failure scenario..."
            />
            <button 
                onClick={handleRiskAnalysis}
                disabled={loading}
                className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition"
            >
                {loading ? 'Analyzing...' : 'Generate Risk Report'}
            </button>
        </div>

        {generatedRisk && (
            <div className="bg-gray-50 p-4 rounded border border-gray-200 animate-fade-in">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                    {generatedRisk}
                </div>
            </div>
        )}
      </div>

       {/* Static Reliability Data */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-3">Reliability Calculations</h4>
                <ul className="text-sm space-y-2 text-gray-600">
                    <li className="flex justify-between border-b pb-1"><span>Target System MTTF:</span> <span className="font-mono font-bold">12,500 Hrs</span></li>
                    <li className="flex justify-between border-b pb-1"><span>Shoulder Gearbox L10 Life:</span> <span className="font-mono">15,000 Hrs</span></li>
                    <li className="flex justify-between border-b pb-1"><span>Cable Fatigue Limit:</span> <span className="font-mono">1M Cycles</span></li>
                    <li className="flex justify-between pt-1"><span>Availability:</span> <span className="font-mono text-green-600">99.98%</span></li>
                </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                 <h4 className="font-bold text-gray-800 mb-3">Tolerance Stack-up (Wrist Assembly)</h4>
                 <div className="text-xs font-mono bg-gray-100 p-3 rounded">
                    Global Tolerance: ±0.500 mm<br/>
                    ---------------------------<br/>
                    + Link 2 Machining: ±0.050<br/>
                    + J7 Bearing Play:  ±0.025<br/>
                    + J8 Gear Backlash: ±0.150<br/>
                    + Thermal Exp (30C):±0.040<br/>
                    ---------------------------<br/>
                    Worst Case Error:   ±0.265 mm<br/>
                    Result: <span className="text-green-600 font-bold">PASS (Within ±0.5mm req)</span>
                 </div>
            </div>
       </div>
    </div>
  );
};

export default AnalysisView;
