import { useState, useEffect, useCallback } from 'react';
import { KnowledgeGraphStorage, GraphState } from '@/lib/supabaseKnowledgeGraphStorage';
import { toast } from 'sonner';

export interface GraphStateData {
  selectedNode: string | null;
  filter: {
    categories: string[];
    techStack: string[];
    searchTerm: string;
  };
  viewMode: string;
  customPositions?: Record<string, { x: number; y: number }>;
}

export interface SessionData {
  nodeClicks: Record<string, number>;
  connectionViews: Record<string, number>;
  searchTerms: string[];
  filterUsage: Record<string, number>;
  startTime: number;
}

export function useKnowledgeGraphPersistence() {
  const [savedStates, setSavedStates] = useState<GraphState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData>({
    nodeClicks: {},
    connectionViews: {},
    searchTerms: [],
    filterUsage: {},
    startTime: Date.now()
  });

  // Load saved states on mount
  useEffect(() => {
    loadSavedStates();
  }, []);

  // Save session data on unmount
  useEffect(() => {
    return () => {
      const duration = Math.floor((Date.now() - sessionData.startTime) / 1000);
      if (duration > 5) { // Only save sessions longer than 5 seconds
        KnowledgeGraphStorage.saveSession({
          session_name: `Session ${new Date().toLocaleString()}`,
          graph_state: {} as any, // Current state would be passed here
          interactions: sessionData,
          duration
        });
      }
    };
  }, [sessionData]);

  const loadSavedStates = async () => {
    setIsLoading(true);
    try {
      const states = await KnowledgeGraphStorage.loadGraphStates();
      setSavedStates(states);
    } catch (error) {
      console.error('Failed to load saved states:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCurrentState = async (name: string, state: GraphStateData) => {
    setIsLoading(true);
    try {
      const saved = await KnowledgeGraphStorage.saveGraphState(name, state);
      if (saved) {
        toast.success('Graph state saved successfully');
        await loadSavedStates();
        return saved;
      } else {
        toast.error('Failed to save graph state');
        return null;
      }
    } catch (error) {
      console.error('Failed to save state:', error);
      toast.error('Failed to save graph state');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loadState = async (stateId: string): Promise<GraphStateData | null> => {
    const state = savedStates.find(s => s.id === stateId);
    if (state) {
      toast.success('Graph state loaded');
      return state.state;
    }
    toast.error('State not found');
    return null;
  };

  const deleteState = async (stateId: string) => {
    setIsLoading(true);
    try {
      const success = await KnowledgeGraphStorage.deleteGraphState(stateId);
      if (success) {
        toast.success('Graph state deleted');
        await loadSavedStates();
      } else {
        toast.error('Failed to delete state');
      }
    } catch (error) {
      console.error('Failed to delete state:', error);
      toast.error('Failed to delete state');
    } finally {
      setIsLoading(false);
    }
  };

  const trackNodeClick = useCallback((nodeId: string) => {
    setSessionData(prev => ({
      ...prev,
      nodeClicks: {
        ...prev.nodeClicks,
        [nodeId]: (prev.nodeClicks[nodeId] || 0) + 1
      }
    }));
  }, []);

  const trackConnectionView = useCallback((connectionId: string) => {
    setSessionData(prev => ({
      ...prev,
      connectionViews: {
        ...prev.connectionViews,
        [connectionId]: (prev.connectionViews[connectionId] || 0) + 1
      }
    }));
  }, []);

  const trackSearch = useCallback((searchTerm: string) => {
    if (searchTerm && !sessionData.searchTerms.includes(searchTerm)) {
      setSessionData(prev => ({
        ...prev,
        searchTerms: [...prev.searchTerms, searchTerm]
      }));
    }
  }, [sessionData.searchTerms]);

  const trackFilterUsage = useCallback((filterType: string) => {
    setSessionData(prev => ({
      ...prev,
      filterUsage: {
        ...prev.filterUsage,
        [filterType]: (prev.filterUsage[filterType] || 0) + 1
      }
    }));
  }, []);

  return {
    savedStates,
    isLoading,
    saveCurrentState,
    loadState,
    deleteState,
    trackNodeClick,
    trackConnectionView,
    trackSearch,
    trackFilterUsage,
    refreshStates: loadSavedStates
  };
}