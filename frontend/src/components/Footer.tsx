import React from 'react';
import { Github, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <div className="fixed bottom-3 right-4 z-50">
      <div className="flex items-center gap-3 text-xs text-slate-600">
        <a href="https://github.com/JaivPatel07" target="_blank" rel="noopener noreferrer">
          <img
            src="https://github.com/JaivPatel07.png"
            alt="Jaiv Patel"
            className="w-6 h-6 rounded-full border-2 border-slate-700/50 hover:border-indigo-500/50 transition-colors"
          />
        </a>
        <span className="font-semibold text-slate-500">JAIV PATEL</span>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/JaivPatel07"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-400 transition-colors"
          >
            <Github size={14} />
          </a>
          <a href="https://www.linkedin.com/in/jaiv-patel-52040b308" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">
            <Linkedin size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};