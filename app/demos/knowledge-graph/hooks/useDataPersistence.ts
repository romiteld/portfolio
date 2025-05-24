import { useState, useEffect, useCallback } from 'react';
import { GraphState } from '../types';

const STORAGE_KEY = 'knowledge-graph-state';
const HISTORY_KEY = 'knowledge-graph-history';
const PREFERENCES_KEY = 'knowledge-graph-preferences';

interface SavedState {
  selectedNode: string | null;
  filter: GraphState['filter'];
  viewMode: GraphState['viewMode'];
  cameraPosition?: { x: number; y: number; z: number };
  timestamp: number;
}

interface UserPreferences {
  performanceMode: 'auto' | 'high' | 'low';
  showParticles: boolean;
  showLabels: boolean;
  autoRotate: boolean;
  soundEnabled: boolean;
}

interface ViewHistory {
  nodeId: string;
  timestamp: number;
  duration: number;
}

export function useDataPersistence() {
  // Load saved state
  const loadState = (): Partial<GraphState> | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data: SavedState = JSON.parse(saved);
        // Check if data is not too old (24 hours)
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          return {
            selectedNode: data.selectedNode,
            filter: data.filter,
            viewMode: data.viewMode
          };
        }
      }
    } catch (error) {
      console.error('Failed to load saved state:', error);
    }
    return null;
  };

  // Save state
  const saveState = useCallback((state: Partial<GraphState>) => {
    try {
      const savedState: SavedState = {
        selectedNode: state.selectedNode || null,
        filter: state.filter || { categories: [], techStack: [], searchTerm: '' },
        viewMode: state.viewMode || 'default',
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }, []);

  // Load preferences
  const loadPreferences = (): UserPreferences => {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
    
    return {
      performanceMode: 'auto',
      showParticles: true,
      showLabels: true,
      autoRotate: true,
      soundEnabled: false
    };
  };

  // Save preferences
  const savePreferences = useCallback((prefs: UserPreferences) => {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }, []);

  // Track view history
  const trackNodeView = useCallback((nodeId: string, duration: number) => {
    try {
      const historyStr = localStorage.getItem(HISTORY_KEY);
      const history: ViewHistory[] = historyStr ? JSON.parse(historyStr) : [];
      
      history.push({
        nodeId,
        timestamp: Date.now(),
        duration
      });

      // Keep only last 100 entries
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }

      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to track view history:', error);
    }
  }, []);

  // Get view analytics
  const getViewAnalytics = useCallback(() => {
    try {
      const historyStr = localStorage.getItem(HISTORY_KEY);
      if (!historyStr) return null;

      const history: ViewHistory[] = JSON.parse(historyStr);
      
      // Calculate most viewed nodes
      const viewCounts = history.reduce((acc, view) => {
        acc[view.nodeId] = (acc[view.nodeId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate average view duration
      const avgDuration = history.reduce((sum, view) => sum + view.duration, 0) / history.length;

      // Get recent views
      const recentViews = history
        .filter(view => Date.now() - view.timestamp < 7 * 24 * 60 * 60 * 1000) // Last 7 days
        .map(view => view.nodeId);

      return {
        mostViewed: Object.entries(viewCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([nodeId, count]) => ({ nodeId, count })),
        averageViewDuration: avgDuration,
        recentViews: [...new Set(recentViews)],
        totalViews: history.length
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return null;
    }
  }, []);

  // Clear all data
  const clearAllData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(HISTORY_KEY);
      localStorage.removeItem(PREFERENCES_KEY);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }, []);

  // Export data
  const exportData = useCallback(() => {
    try {
      const data = {
        state: localStorage.getItem(STORAGE_KEY),
        history: localStorage.getItem(HISTORY_KEY),
        preferences: localStorage.getItem(PREFERENCES_KEY),
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-graph-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  }, []);

  // Import data
  const importData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.state) localStorage.setItem(STORAGE_KEY, data.state);
        if (data.history) localStorage.setItem(HISTORY_KEY, data.history);
        if (data.preferences) localStorage.setItem(PREFERENCES_KEY, data.preferences);
        window.location.reload(); // Reload to apply imported data
      } catch (error) {
        console.error('Failed to import data:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    loadState,
    saveState,
    loadPreferences,
    savePreferences,
    trackNodeView,
    getViewAnalytics,
    clearAllData,
    exportData,
    importData
  };
}

// Session storage for temporary data
export function useSessionPersistence() {
  const [sessionData, setSessionData] = useState<Record<string, any>>({});

  const saveToSession = useCallback((key: string, value: any) => {
    try {
      sessionStorage.setItem(`kg-${key}`, JSON.stringify(value));
      setSessionData(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Failed to save to session:', error);
    }
  }, []);

  const loadFromSession = useCallback((key: string) => {
    try {
      const saved = sessionStorage.getItem(`kg-${key}`);
      if (saved) {
        const value = JSON.parse(saved);
        setSessionData(prev => ({ ...prev, [key]: value }));
        return value;
      }
    } catch (error) {
      console.error('Failed to load from session:', error);
    }
    return null;
  }, []);

  const clearSession = useCallback(() => {
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('kg-')) {
          sessionStorage.removeItem(key);
        }
      });
      setSessionData({});
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }, []);

  return {
    sessionData,
    saveToSession,
    loadFromSession,
    clearSession
  };
}