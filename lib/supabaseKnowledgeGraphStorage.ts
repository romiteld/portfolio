import { supabase } from './supabaseClient';

export interface GraphState {
  id?: string;
  user_id?: string;
  name: string;
  state: {
    selectedNode: string | null;
    filter: {
      categories: string[];
      techStack: string[];
      searchTerm: string;
    };
    viewMode: string;
    customPositions?: Record<string, { x: number; y: number }>;
  };
  created_at?: string;
  updated_at?: string;
}

export interface GraphSession {
  id?: string;
  user_id?: string;
  session_name: string;
  graph_state: GraphState['state'];
  interactions: {
    nodeClicks: Record<string, number>;
    connectionViews: Record<string, number>;
    searchTerms: string[];
    filterUsage: Record<string, number>;
  };
  duration?: number;
  created_at?: string;
}

export class KnowledgeGraphStorage {
  // Save current graph state
  static async saveGraphState(name: string, state: GraphState['state'], userId?: string): Promise<GraphState | null> {
    try {
      const { data, error } = await supabase
        .from('knowledge_graph_states')
        .insert({
          user_id: userId,
          name,
          state,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving graph state:', error);
      return null;
    }
  }

  // Load saved graph states
  static async loadGraphStates(userId?: string): Promise<GraphState[]> {
    try {
      let query = supabase
        .from('knowledge_graph_states')
        .select('*')
        .order('updated_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading graph states:', error);
      return [];
    }
  }

  // Update existing graph state
  static async updateGraphState(id: string, state: GraphState['state']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('knowledge_graph_states')
        .update({
          state,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating graph state:', error);
      return false;
    }
  }

  // Delete graph state
  static async deleteGraphState(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('knowledge_graph_states')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting graph state:', error);
      return false;
    }
  }

  // Save session analytics
  static async saveSession(session: GraphSession): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('knowledge_graph_sessions')
        .insert({
          ...session,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  }

  // Get session analytics
  static async getSessionAnalytics(limit = 100): Promise<GraphSession[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_graph_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  // Get most clicked nodes
  static async getMostClickedNodes(): Promise<Record<string, number>> {
    try {
      const sessions = await this.getSessionAnalytics();
      const clickCounts: Record<string, number> = {};

      sessions.forEach(session => {
        Object.entries(session.interactions.nodeClicks).forEach(([nodeId, count]) => {
          clickCounts[nodeId] = (clickCounts[nodeId] || 0) + count;
        });
      });

      return clickCounts;
    } catch (error) {
      console.error('Error getting click analytics:', error);
      return {};
    }
  }

  // Get popular search terms
  static async getPopularSearchTerms(): Promise<string[]> {
    try {
      const sessions = await this.getSessionAnalytics();
      const searchCounts: Record<string, number> = {};

      sessions.forEach(session => {
        session.interactions.searchTerms.forEach(term => {
          searchCounts[term] = (searchCounts[term] || 0) + 1;
        });
      });

      return Object.entries(searchCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([term]) => term);
    } catch (error) {
      console.error('Error getting search analytics:', error);
      return [];
    }
  }
}