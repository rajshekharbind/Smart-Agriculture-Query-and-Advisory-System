import React, { useState } from 'react';

const Tabs = ({ children, defaultTab = 0, activeTab: controlledTab, onTabChange }) => {
  const [internalTab, setInternalTab] = useState(defaultTab);
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;

  const handleSelect = (index) => {
    if (onTabChange) {
      onTabChange(index);
    } else {
      setInternalTab(index);
    }
  };

  const panels = React.Children.toArray(children);

  return (
    <div className="w-full flex flex-col flex-1 min-h-0">
      <div className="border-b border-emerald-500/20 bg-slate-950/50 backdrop-blur-md">
        <nav className="max-w-7xl mx-auto flex gap-2 px-4 sm:px-6 py-2.5 overflow-x-auto no-scrollbar">
          {panels.map((child, index) => {
            const isActive = activeTab === index;
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(index)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {child.props.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="flex-1 min-h-0">
        {panels[activeTab]}
      </div>
    </div>
  );
};

const TabPanel = ({ children }) => {
  return <div className="h-full">{children}</div>;
};

Tabs.Panel = TabPanel;

export default Tabs;
