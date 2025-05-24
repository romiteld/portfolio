import { useEffect, useRef, useState, useCallback } from 'react';
import { DemoNode } from '../types';

interface RealtimeUpdate {
  type: 'node_update' | 'connection_update' | 'user_activity' | 'performance_alert';
  nodeId?: string;
  data: any;
  timestamp: number;
}

interface UserActivity {
  userId: string;
  nodeId: string;
  action: 'viewing' | 'hovering' | 'clicked';
  timestamp: number;
}

export function useRealtimeUpdates() {
  const [updates, setUpdates] = useState<RealtimeUpdate[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserActivity[]>([]);
  const [nodeStats, setNodeStats] = useState<Record<string, { views: number; interactions: number }>>({});
  const eventSourceRef = useRef<EventSource | null>(null);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  // Simulate real-time updates (in production, this would connect to a WebSocket or SSE endpoint)
  const simulateUpdates = useCallback(() => {
    const updateTypes: RealtimeUpdate['type'][] = ['node_update', 'connection_update', 'user_activity', 'performance_alert'];
    const randomType = updateTypes[Math.floor(Math.random() * updateTypes.length)];
    
    const update: RealtimeUpdate = {
      type: randomType,
      timestamp: Date.now(),
      data: {}
    };

    switch (randomType) {
      case 'node_update':
        update.nodeId = `demo-${Math.floor(Math.random() * 9)}`;
        update.data = {
          metric: 'popularity',
          value: Math.floor(Math.random() * 100),
          change: Math.random() > 0.5 ? 'increase' : 'decrease'
        };
        break;
      
      case 'user_activity':
        const nodeIds = ['financial-assistant', 'computer-vision', 'chess-ai', 'generative-ai'];
        update.data = {
          userId: `user-${Math.floor(Math.random() * 1000)}`,
          nodeId: nodeIds[Math.floor(Math.random() * nodeIds.length)],
          action: ['viewing', 'hovering', 'clicked'][Math.floor(Math.random() * 3)]
        };
        break;
      
      case 'performance_alert':
        update.data = {
          metric: 'response_time',
          value: Math.random() * 1000,
          threshold: 500,
          severity: Math.random() > 0.7 ? 'high' : 'low'
        };
        break;
    }

    setUpdates(prev => [...prev.slice(-20), update]); // Keep last 20 updates
  }, []);

  // Connect to real-time updates
  const connect = useCallback(() => {
    // In production, replace with actual WebSocket/SSE connection
    // Example WebSocket implementation:
    /*
    const ws = new WebSocket('wss://your-api.com/knowledge-graph/updates');
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      handleUpdate(update);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      reconnect();
    };
    */

    // Simulate updates for demo
    updateInterval.current = setInterval(simulateUpdates, 3000);
  }, [simulateUpdates]);

  // Disconnect from updates
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }
  }, []);

  // Subscribe to specific node updates
  const subscribeToNode = useCallback((nodeId: string) => {
    // In production, send subscription request to server
    console.log(`Subscribed to updates for node: ${nodeId}`);
  }, []);

  // Unsubscribe from node updates
  const unsubscribeFromNode = useCallback((nodeId: string) => {
    // In production, send unsubscription request to server
    console.log(`Unsubscribed from updates for node: ${nodeId}`);
  }, []);

  // Get live statistics for a node
  const getNodeLiveStats = useCallback((nodeId: string) => {
    return nodeStats[nodeId] || { views: 0, interactions: 0 };
  }, [nodeStats]);

  // Update node statistics
  useEffect(() => {
    const interval = setInterval(() => {
      setNodeStats(prev => {
        const updated = { ...prev };
        
        // Simulate view/interaction changes
        Object.keys(updated).forEach(nodeId => {
          if (Math.random() > 0.7) {
            updated[nodeId] = {
              views: updated[nodeId].views + Math.floor(Math.random() * 5),
              interactions: updated[nodeId].interactions + Math.floor(Math.random() * 2)
            };
          }
        });

        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Track active users
  useEffect(() => {
    const handleUserActivity = (activity: UserActivity) => {
      setActiveUsers(prev => {
        const filtered = prev.filter(a => 
          Date.now() - a.timestamp < 30000 // Remove after 30 seconds
        );
        return [...filtered, activity];
      });
    };

    // Simulate user activity
    const activityInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        const nodeIds = ['financial-assistant', 'computer-vision', 'chess-ai'];
        handleUserActivity({
          userId: `user-${Math.floor(Math.random() * 100)}`,
          nodeId: nodeIds[Math.floor(Math.random() * nodeIds.length)],
          action: 'viewing',
          timestamp: Date.now()
        });
      }
    }, 2000);

    return () => clearInterval(activityInterval);
  }, []);

  // Initialize connection
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    updates,
    activeUsers,
    nodeStats,
    subscribeToNode,
    unsubscribeFromNode,
    getNodeLiveStats,
    isConnected: !!eventSourceRef.current || !!updateInterval.current
  };
}

// Hook for broadcasting user actions
export function useBroadcastActivity() {
  const broadcast = useCallback((action: {
    nodeId: string;
    type: 'hover' | 'click' | 'view';
    duration?: number;
  }) => {
    // In production, send to server
    console.log('Broadcasting activity:', action);
    
    // Could use Beacon API for reliability
    if ('sendBeacon' in navigator) {
      const data = JSON.stringify({
        ...action,
        timestamp: Date.now(),
        sessionId: getSessionId()
      });
      
      // navigator.sendBeacon('/api/knowledge-graph/activity', data);
    }
  }, []);

  return { broadcast };
}

// Get or create session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('kg-session-id');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('kg-session-id', sessionId);
  }
  return sessionId;
}