/**
 * Component for popup navigation tabs
 */

import React from 'react';

interface PopupTabsProps {
  activeIdx: number;
  setActiveIdx: (idx: number) => void;
  htmlSections: { key: string; label: string; html: string }[];
}

export function PopupTabs({ activeIdx, setActiveIdx, htmlSections }: PopupTabsProps) {
  return (
    <div className="flex items-center gap-3 border-b border-[#e5e5e5] pb-2 mb-2 flex-shrink-0">
      <div className="flex-1 flex flex-wrap gap-2">
        {/* J4YDict Tab - Always first */}
        <button
          className={`px-2 py-1 rounded-xl text-sm ${activeIdx === 0 ? 'bg-[#f2f2f2]' : 'bg-transparent hover:bg-[#f7f7f7]'}`}
          onClick={() => setActiveIdx(0)}
        >
          J4YDict
        </button>

        {/* Google Translate Tab - Always second */}
        <button
          className={`px-2 py-1 rounded-xl text-sm ${activeIdx === 1 ? 'bg-[#f2f2f2]' : 'bg-transparent hover:bg-[#f7f7f7]'}`}
          onClick={() => setActiveIdx(1)}
        >
          Google Dịch
        </button>

        {/* TraCau Tabs - shifted by +2 */}
        {htmlSections.map((s, i) => (
          <button
            key={s.key + i}
            className={`px-2 py-1 rounded-xl text-sm ${(i + 2) === activeIdx ? 'bg-[#f2f2f2]' : 'bg-transparent hover:bg-[#f7f7f7]'}`}
            onClick={() => setActiveIdx(i + 2)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
