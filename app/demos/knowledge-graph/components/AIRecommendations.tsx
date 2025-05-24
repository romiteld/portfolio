'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ChevronRight, X } from 'lucide-react';
import { demoNodes, connections } from '../utils/demoData';
import { DemoNode } from '../types';

interface AIRecommendationsProps {
  selectedNode: string | null;
  visitedNodes: Set<string>;
  onNodeSelect: (nodeId: string) => void;
}

interface Recommendation {
  node: DemoNode;
  reason: string;
  score: number;
}

export function AIRecommendations({ selectedNode, visitedNodes, onNodeSelect }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      const recs = generateRecommendations(selectedNode, visitedNodes);
      setRecommendations(recs);
      if (recs.length > 0) {
        setIsVisible(true);
      }
    }
  }, [selectedNode, visitedNodes]);

  const generateRecommendations = (nodeId: string, visited: Set<string>): Recommendation[] => {
    const currentNode = demoNodes.find(n => n.id === nodeId);
    if (!currentNode) return [];

    const recommendations: Recommendation[] = [];

    // 1. Direct connections (highest priority)
    const directConnections = connections
      .filter(c => c.source === nodeId || c.target === nodeId)
      .map(c => c.source === nodeId ? c.target : c.source)
      .filter(id => !visited.has(id));

    directConnections.forEach(targetId => {
      const node = demoNodes.find(n => n.id === targetId);
      if (node) {
        const connection = connections.find(c => 
          (c.source === nodeId && c.target === targetId) ||
          (c.target === nodeId && c.source === targetId)
        );
        
        recommendations.push({
          node,
          reason: connection?.description || 'Directly connected',
          score: 1.0
        });
      }
    });

    // 2. Similar technology stack
    const techOverlapNodes = demoNodes
      .filter(n => n.id !== nodeId && !visited.has(n.id))
      .map(node => {
        const overlap = node.techStack.filter(tech => 
          currentNode.techStack.includes(tech)
        ).length;
        return { node, overlap };
      })
      .filter(item => item.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 3);

    techOverlapNodes.forEach(({ node, overlap }) => {
      if (!recommendations.find(r => r.node.id === node.id)) {
        recommendations.push({
          node,
          reason: `Shares ${overlap} technologies`,
          score: overlap / Math.max(node.techStack.length, currentNode.techStack.length)
        });
      }
    });

    // 3. Same category exploration
    const sameCategoryNodes = demoNodes
      .filter(n => 
        n.id !== nodeId && 
        n.category === currentNode.category && 
        !visited.has(n.id)
      )
      .slice(0, 2);

    sameCategoryNodes.forEach(node => {
      if (!recommendations.find(r => r.node.id === node.id)) {
        recommendations.push({
          node,
          reason: `Similar ${currentNode.category} capabilities`,
          score: 0.6
        });
      }
    });

    // 4. Complementary features
    const complementaryNodes = getComplementaryNodes(currentNode, visited);
    complementaryNodes.forEach(({ node, reason }) => {
      if (!recommendations.find(r => r.node.id === node.id)) {
        recommendations.push({
          node,
          reason,
          score: 0.7
        });
      }
    });

    // Sort by score and return top 4
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  };

  const getComplementaryNodes = (currentNode: DemoNode, visited: Set<string>): { node: DemoNode; reason: string }[] => {
    const complementary: { node: DemoNode; reason: string }[] = [];

    // Define complementary relationships
    const complementaryMap: Record<string, { ids: string[]; reason: string }> = {
      'financial-assistant': {
        ids: ['data-analyst', 'enhanced-rag'],
        reason: 'Enhanced financial analysis'
      },
      'computer-vision': {
        ids: ['generative-ai', 'data-analyst'],
        reason: 'Visual data processing'
      },
      'chess-ai': {
        ids: ['interactive-agents'],
        reason: 'Strategic AI planning'
      },
      'sales-agent': {
        ids: ['interactive-agents', 'enhanced-rag'],
        reason: 'Advanced conversation AI'
      },
      'youtube-summarizer': {
        ids: ['enhanced-rag', 'generative-ai'],
        reason: 'Content processing pipeline'
      }
    };

    const suggestions = complementaryMap[currentNode.id];
    if (suggestions) {
      suggestions.ids.forEach(id => {
        if (!visited.has(id)) {
          const node = demoNodes.find(n => n.id === id);
          if (node) {
            complementary.push({ node, reason: suggestions.reason });
          }
        }
      });
    }

    return complementary;
  };

  if (!isVisible || recommendations.length === 0) return null;

  return (
    <Card className="absolute bottom-6 left-6 p-4 max-w-sm bg-black/80 backdrop-blur-xl border-purple-500/30 text-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          AI Recommendations
        </h3>
        <Button
          size="icon"
          variant="ghost"
          className="w-6 h-6"
          onClick={() => setIsVisible(false)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      <div className="space-y-2">
        {recommendations.map((rec, index) => (
          <div
            key={rec.node.id}
            className="p-2 rounded bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
            onClick={() => onNodeSelect(rec.node.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{rec.node.icon}</span>
                  <span className="text-sm font-medium">{rec.node.name}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{rec.reason}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
            </div>
            {index === 0 && (
              <Badge variant="outline" className="mt-2 text-xs border-purple-500/50 text-purple-300">
                Best Match
              </Badge>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Based on connections and technology overlap
      </p>
    </Card>
  );
}

// Hook to track visited nodes
export function useNodeHistory() {
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
  const [nodeHistory, setNodeHistory] = useState<string[]>([]);

  const visitNode = (nodeId: string) => {
    setVisitedNodes(prev => new Set(prev).add(nodeId));
    setNodeHistory(prev => [...prev, nodeId]);
  };

  const clearHistory = () => {
    setVisitedNodes(new Set());
    setNodeHistory([]);
  };

  return { visitedNodes, nodeHistory, visitNode, clearHistory };
}