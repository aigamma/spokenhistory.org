/**
 * @fileoverview Visualizations page component for the Civil Rights History Project.
 * 
 * This component serves as the visualization interface for the application, featuring
 * a tabbed visualization interface that allows users to explore civil rights
 * history through different visualization modes (timeline, keywords, map).
 */

import { useState } from 'react';
import VisualizationContainer from '../components/visualization/VisualizationContainer.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Visualizations - Main visualization interface component
 * 
 * This component:
 * 1. Displays the visualization title and interface
 * 2. Manages a tabbed interface for different data visualizations
 * 3. Renders the appropriate visualization based on active tab
 * 4. Provides user authentication context access
 * 
 * @returns {React.ReactElement} The visualizations page with tabbed interface
 */
export default function Visualizations() {
  useDocumentTitle('Visualizations');
  /**
   * State to track the currently active visualization tab
   * Options: 'timeline', 'keywords', 'map'
   * @type {[string, Function]} - Current active tab and setter function
   */
  const [activeTab, setActiveTab] = useState('timeline');
  
  
  /**
   * Array of available visualization tabs
   * Intentionally ordered to show timeline first as the default view
   * @type {string[]} Array of tab identifiers
   */
  const tabs = ['timeline', 'map'];
  
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-zinc-900 min-h-screen font-body">
      {/* Hero Section - Main title and introduction */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 text-transparent bg-clip-text mb-6">
          Interactive Visualizations
        </h1>
        <p className="text-lg font-body text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Explore civil rights history through interactive timeline and geographical mapping.
        </p>
      </div>
      
      {/* Visualization Section - Contains tabs and visualization container.
          Tabs converted to the WAI-ARIA Authoring Practices tabs pattern:
          role="tablist" on the container, role="tab" + aria-selected on
          each button, role="tabpanel" + aria-labelledby on the content
          panel. Without these roles, screen readers announce each tab
          just as a generic button rather than as part of a tab set,
          and there's no way for a screen reader user to know what tab
          is currently selected. */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 mb-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-zinc-800">
          <div role="tablist" aria-label="Visualization type" className="flex flex-wrap">
            {tabs.map((tab) => {
              const label = tab.charAt(0).toUpperCase() + tab.slice(1)
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  id={`tab-${tab}`}
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 px-3 min-h-11 text-sm text-center transition-all duration-300 cursor-pointer border-0 font-body ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-zinc-800 text-blue-800 dark:text-blue-300 font-semibold border-b-2 border-blue-600 dark:border-blue-400'
                      : 'bg-transparent text-gray-600 dark:text-zinc-400 font-normal border-b-0 hover:text-gray-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Visualization Content. role="tabpanel" + id matching the
            active tab's aria-controls so screen readers tie the panel
            to the selected tab. */}
        <div
          className="p-6"
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          <VisualizationContainer activeVisualization={activeTab} />
        </div>
      </div>
    </div>
  );
} 