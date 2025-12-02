import React from 'react';

interface DocSectionProps {
  title: string;
  content: string;
  isCode?: boolean;
}

const DocSection: React.FC<DocSectionProps> = ({ title, content, isCode = false }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <span className="text-xs font-mono text-gray-400">DOC-REF-{Math.floor(Math.random() * 1000)}</span>
      </div>
      <div className="p-6">
        {isCode ? (
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
            {content}
          </pre>
        ) : (
          <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
            {content}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocSection;
