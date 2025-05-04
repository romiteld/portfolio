'use client';

import { useState } from 'react';

interface UserPreferencesProps {
  onSave: (preferences: UserPreferencesData) => void;
  initialPreferences?: UserPreferencesData;
}

export interface UserPreferencesData {
  investmentStyle: 'conservative' | 'moderate' | 'aggressive';
  portfolioFocus: string[];
  riskTolerance: 1 | 2 | 3 | 4 | 5;
  timeHorizon: 'short' | 'medium' | 'long';
  favoriteSymbols: string[];
}

export default function UserPreferences({ onSave, initialPreferences }: UserPreferencesProps) {
  const [preferences, setPreferences] = useState<UserPreferencesData>(
    initialPreferences || {
      investmentStyle: 'moderate',
      portfolioFocus: ['stocks'],
      riskTolerance: 3,
      timeHorizon: 'medium',
      favoriteSymbols: [],
    }
  );
  
  const [newSymbol, setNewSymbol] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const updatedFocus = checked
      ? [...preferences.portfolioFocus, name]
      : preferences.portfolioFocus.filter((item) => item !== name);

    setPreferences((prev) => ({
      ...prev,
      portfolioFocus: updatedFocus,
    }));
  };

  const handleAddSymbol = () => {
    if (newSymbol && !preferences.favoriteSymbols.includes(newSymbol.toUpperCase())) {
      setPreferences((prev) => ({
        ...prev,
        favoriteSymbols: [...prev.favoriteSymbols, newSymbol.toUpperCase()],
      }));
      setNewSymbol('');
    }
  };

  const handleRemoveSymbol = (symbol: string) => {
    setPreferences((prev) => ({
      ...prev,
      favoriteSymbols: prev.favoriteSymbols.filter((s) => s !== symbol),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(preferences);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm p-2 mb-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md flex items-center"
        aria-label="Open preferences"
        title="Personalize Your Financial Assistant"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Personalize Your Financial Assistant
      </button>
    );
  }

  return (
    <div className="mb-6 p-4 border dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-md">
      <h3 className="text-lg font-semibold mb-4 flex justify-between">
        <span>Customize Your Financial Assistant</span>
        <button 
          onClick={() => setIsOpen(false)} 
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close preferences"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="investmentStyle" className="block text-sm font-medium mb-1">Investment Style</label>
          <select
            id="investmentStyle"
            name="investmentStyle"
            value={preferences.investmentStyle}
            onChange={handleChange}
            className="w-full p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700"
            aria-label="Investment Style"
            title="Choose your investment style"
          >
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Portfolio Focus</label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="stocks"
                name="stocks"
                checked={preferences.portfolioFocus.includes('stocks')}
                onChange={handleCheckboxChange}
                className="mr-2"
              />
              <label htmlFor="stocks" className="text-sm">Stocks</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="etfs"
                name="etfs"
                checked={preferences.portfolioFocus.includes('etfs')}
                onChange={handleCheckboxChange}
                className="mr-2"
              />
              <label htmlFor="etfs" className="text-sm">ETFs</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="crypto"
                name="crypto"
                checked={preferences.portfolioFocus.includes('crypto')}
                onChange={handleCheckboxChange}
                className="mr-2"
              />
              <label htmlFor="crypto" className="text-sm">Cryptocurrency</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="commodities"
                name="commodities"
                checked={preferences.portfolioFocus.includes('commodities')}
                onChange={handleCheckboxChange}
                className="mr-2"
              />
              <label htmlFor="commodities" className="text-sm">Commodities</label>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="riskTolerance" className="block text-sm font-medium mb-1">Risk Tolerance (1-5)</label>
          <div className="flex items-center">
            <span className="mr-2 text-sm">Low</span>
            <input
              id="riskTolerance"
              type="range"
              name="riskTolerance"
              min="1"
              max="5"
              value={preferences.riskTolerance}
              onChange={(e) => {
                const value = parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5;
                setPreferences((prev) => ({ ...prev, riskTolerance: value }));
              }}
              className="mx-2 w-full"
              aria-label="Risk Tolerance"
              title="Set your risk tolerance level from 1 (low) to 5 (high)"
            />
            <span className="ml-2 text-sm">High</span>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="timeHorizon" className="block text-sm font-medium mb-1">Time Horizon</label>
          <select
            id="timeHorizon"
            name="timeHorizon"
            value={preferences.timeHorizon}
            onChange={handleChange}
            className="w-full p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700"
            aria-label="Time Horizon"
            title="Choose your investment time horizon"
          >
            <option value="short">Short Term (&lt; 2 years)</option>
            <option value="medium">Medium Term (2-5 years)</option>
            <option value="long">Long Term (&gt; 5 years)</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="newSymbol" className="block text-sm font-medium mb-1">Favorite Symbols</label>
          <div className="flex items-center">
            <input
              id="newSymbol"
              type="text"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              placeholder="Add symbol (e.g. AAPL)"
              className="p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 flex-1 mr-2"
              aria-label="Enter stock symbol"
            />
            <button
              type="button"
              onClick={handleAddSymbol}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              aria-label="Add symbol"
            >
              Add
            </button>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2">
            {preferences.favoriteSymbols.map((symbol) => (
              <div
                key={symbol}
                className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center"
              >
                <span className="text-sm">{symbol}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSymbol(symbol)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                  aria-label={`Remove ${symbol}`}
                  title={`Remove ${symbol}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 mr-2 border dark:border-gray-600 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
} 