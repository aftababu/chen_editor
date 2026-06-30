import React from "react";
import { Link } from "react-router-dom";
import { CHEATSHEET } from "../lib/chenParser";

export default function ChenCodeEditor({
  code,
  setCode,
  errors,
  onOpenAiPanel,
}) {
  return (
    <div className="w-full h-full flex flex-col z-10 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* HEADER */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950 flex justify-between items-center shadow-sm z-10 transition-colors duration-300">
        <h2 className="text-md font-bold text-slate-700 dark:text-slate-300">
          Chen Code
        </h2>
        <button
          onClick={onOpenAiPanel}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-md shadow-blue-500/20 transition-all active:scale-95"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 21l8.982-11.795H13.62l1.568-7.709-8.982 11.795h5.607z"
            />
          </svg>
          <span>Generate with AI</span>
        </button>
      </div>

      {/* TEXTAREA */}
      <textarea
        className="flex-1 w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 font-mono text-sm resize-none outline-none focus:ring-inset focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 leading-relaxed border-none transition-colors duration-300"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck="false"
        placeholder="// Type your Chen Code here or use the AI Generator"
      />

      {/* ERRORS */}
      {errors.length > 0 && (
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-t border-red-100 dark:border-red-900/50 p-4 font-mono text-xs space-y-1 overflow-y-auto max-h-32 shadow-inner transition-colors duration-300">
          <h3 className="font-bold text-red-700 dark:text-red-500 uppercase tracking-wider text-[10px] mb-1">
            Parser Errors:
          </h3>
          {errors.map((err, i) => (
            <div key={i} className="flex items-start">
              <span className="text-red-500 mr-1.5">●</span>
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
