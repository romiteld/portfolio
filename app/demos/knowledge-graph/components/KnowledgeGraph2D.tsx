'use client';

import React from 'react';
import { demoNodes, connections } from '../utils/demoData';

interface KnowledgeGraph2DProps {
  selectedNode: string | null;
  hoveredNode: string | null;
  onSelectNode: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
  searchTerm: string;
  selectedCategory: string;
}

export function KnowledgeGraph2D({
  selectedNode,
  hoveredNode,
  onSelectNode,
  onHoverNode,
  searchTerm,
  selectedCategory
}: KnowledgeGraph2DProps) {
  // Filter nodes
  const filteredNodes = demoNodes.filter(node => {
    const matchesSearch = searchTerm === '' || 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.techStack.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Convert 3D positions to 2D
  const nodePositions = filteredNodes.map(node => ({
    ...node,
    x: ((node.position[0] + 5) / 10) * 100,
    y: ((node.position[2] + 5) / 10) * 100
  }));

  const getConnectedNodes = (nodeId: string) => {
    const connected = new Set<string>();
    connections.forEach(conn => {
      if (conn.source === nodeId) connected.add(conn.target);
      if (conn.target === nodeId) connected.add(conn.source);
    });
    return connected;
  };

  const connectedNodes = selectedNode ? getConnectedNodes(selectedNode) : new Set();

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Connections SVG */}
      <svg className="absolute inset-0 w-full h-full">
        {connections.map(conn => {
          const source = nodePositions.find(n => n.id === conn.source);
          const target = nodePositions.find(n => n.id === conn.target);
          if (!source || !target) return null;

          const isHighlighted = selectedNode === conn.source || selectedNode === conn.target;
          const opacity = selectedNode ? (isHighlighted ? 0.9 : 0.1) : 0.4;

          return (
            <line
              key={conn.id}
              x1={`${source.x}%`}
              y1={`${source.y}%`}
              x2={`${target.x}%`}
              y2={`${target.y}%`}
              stroke={conn.type === 'data' ? '#00D9FF' : 
                     conn.type === 'api' ? '#FFD700' :
                     conn.type === 'model' ? '#FF00FF' : '#00FF00'}
              strokeWidth={isHighlighted ? 3 : 1}
              opacity={opacity}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodePositions.map(node => {
        const isSelected = selectedNode === node.id;
        const isHovered = hoveredNode === node.id;
        const isConnected = connectedNodes.has(node.id);
        const shouldHighlight = isSelected || isConnected || !selectedNode;

        return (
          <div
            key={node.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 cursor-pointer"
            style={{ 
              left: `${node.x}%`, 
              top: `${node.y}%`,
              opacity: shouldHighlight ? 1 : 0.3,
              transform: `translate(-50%, -50%) scale(${isSelected ? 1.3 : isHovered ? 1.15 : 1})`,
              zIndex: isSelected ? 20 : isHovered ? 15 : 10
            }}
            onClick={() => onSelectNode(selectedNode === node.id ? null : node.id)}
            onMouseEnter={() => onHoverNode(node.id)}
            onMouseLeave={() => onHoverNode(null)}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ 
                background: `radial-gradient(circle at 30% 30%, ${node.color}40, ${node.color})`,
                boxShadow: `0 0 20px ${node.color}60`,
                border: `2px solid ${node.color}80`
              }}
            >
              <span className="text-2xl">{node.icon}</span>
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <div className="px-2 py-1 rounded text-xs font-mono" style={{ color: node.color }}>
                {node.name}
              </div>
            </div>
          </div>
        );
      })}

      {/* Fallback message */}
      <div className="absolute bottom-4 left-4 text-cyan-400 text-xs font-mono">
        2D Fallback Mode (WebGL unavailable)
      </div>
    </div>
  );
}