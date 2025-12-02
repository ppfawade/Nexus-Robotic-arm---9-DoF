
import React from 'react';
import { BOM_DATA } from '../constants';

const BomView: React.FC = () => {
  const grandTotal = BOM_DATA.reduce((acc, item) => acc + item.totalCost, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Bill of Materials (10k Volume)</h3>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                Total: ${grandTotal.toLocaleString()}
            </span>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specification</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended Supplier</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {BOM_DATA.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{item.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{item.spec}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{item.supplier}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.qty}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">${item.unitCost}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">${item.totalCost}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-sm text-gray-500 flex justify-between">
             <span>* Pricing estimates based on trusted Tier-1 suppliers (Shenzhen/Taiwan logistics hub). Includes 5% scrap buffer.</span>
             <span className="font-medium text-blue-800">Supplier Recommendation: Lead time 4-6 weeks for motors.</span>
        </div>
    </div>
  );
};

export default BomView;
