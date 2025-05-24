'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { demoNodes, connections } from './utils/demoData';

export default function KnowledgeGraphPage() {
  const [isClient, setIsClient] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading Knowledge Graph...</div>
      </div>
    );
  }

  // Filter nodes based on search and category
  const filteredNodes = demoNodes.filter(node => {
    const matchesSearch = searchTerm === '' || 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.techStack.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Calculate positions for filtered nodes in a circle
  const nodePositions = filteredNodes.map((node, index) => {
    const angle = (index / filteredNodes.length) * 2 * Math.PI - Math.PI / 2; // Start from top
    const radius = 30; // Percentage of viewport - reduced to fit better
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    return { ...node, x, y };
  });

  // Get unique categories
  const categories = ['all', ...new Set(demoNodes.map(node => node.category))];

  // Get connected nodes for highlighting
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
    <div className="w-full h-screen bg-gray-900 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-4 bg-black/50 backdrop-blur-sm z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex-shrink-0">
              <h1 className="text-xl lg:text-2xl font-bold text-white">
                AI Portfolio Knowledge Graph
              </h1>
              <p className="text-gray-300 text-sm hidden sm:block">
                Click on nodes to explore connections between AI demos
              </p>
            </div>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors w-full sm:w-40 lg:w-48"
              />
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors w-full sm:w-auto"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {filteredNodes.length === 0 && (
            <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-600/50 rounded">
              <p className="text-yellow-400 text-xs">No demos found matching your search criteria.</p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 relative bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-0">
          <div className="absolute inset-0 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                                radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                                radial-gradient(circle at 40% 20%, rgba(255, 219, 98, 0.3) 0%, transparent 50%)`
              }} />
            </div>
            
            {/* SVG for connections */}
            <svg className="absolute inset-0 w-full h-full">
              {connections.map(conn => {
                const source = nodePositions.find(n => n.id === conn.source);
                const target = nodePositions.find(n => n.id === conn.target);
                if (!source || !target) return null;

                const isHighlighted = selectedNode === conn.source || selectedNode === conn.target;
                const opacity = selectedNode ? (isHighlighted ? 0.8 : 0.1) : 0.3;

                return (
                  <line
                    key={conn.id}
                    x1={`${source.x}%`}
                    y1={`${source.y}%`}
                    x2={`${target.x}%`}
                    y2={`${target.y}%`}
                    stroke={isHighlighted ? conn.type === 'data' ? '#00D9FF' : 
                           conn.type === 'api' ? '#FFD700' :
                           conn.type === 'model' ? '#FF00FF' : '#00FF00' : 'rgba(255,255,255,0.2)'}
                    strokeWidth={isHighlighted ? 3 : 1}
                    opacity={opacity}
                    className="transition-all duration-300"
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
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10"
                  style={{ 
                    left: `${node.x}%`, 
                    top: `${node.y}%`,
                    opacity: shouldHighlight ? 1 : 0.3,
                    transform: `translate(-50%, -50%) scale(${isSelected ? 1.2 : isHovered ? 1.1 : 1})`
                  }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                >
                  <div 
                    className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl cursor-pointer transition-all duration-300 border-2 border-white/20"
                    style={{ 
                      backgroundColor: node.color || '#4B5563',
                      boxShadow: `0 0 20px ${node.color}40`
                    }}
                  >
                    <span className="text-2xl">{node.icon}</span>
                    
                    {/* Node label */}
                    <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <p className="text-white text-xs font-semibold bg-black/80 px-2 py-0.5 rounded">
                        {node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name}
                      </p>
                    </div>

                    {/* Status indicator */}
                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-black ${
                      node.status === 'active' ? 'bg-green-500' : 
                      node.status === 'beta' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    
                    {isSelected && (
                      <div className="absolute inset-0 rounded-full ring-4 ring-white ring-opacity-50 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Node Info Panel */}
          {selectedNode && (
            <div className="absolute top-4 right-4 p-4 bg-black/95 backdrop-blur-md rounded-lg w-80 shadow-2xl z-20 max-h-[calc(100vh-200px)] overflow-y-auto">
              {(() => {
                const node = demoNodes.find(n => n.id === selectedNode);
                if (!node) return null;
                
                return (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{node.icon}</span>
                        <div>
                          <h3 className="text-white font-bold text-sm">
                            {node.name}
                          </h3>
                          <span className={`inline-block px-1.5 py-0.5 text-xs rounded ${
                            node.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                            node.status === 'beta' ? 'bg-yellow-500/20 text-yellow-400' : 
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {node.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="text-gray-400 hover:text-white text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <p className="text-gray-300 text-xs mb-3">
                      {node.description}
                    </p>
                    
                    <div className="mb-3">
                      <p className="text-gray-400 text-xs mb-1">Tech Stack:</p>
                      <div className="flex flex-wrap gap-1">
                        {node.techStack.slice(0, 4).map(tech => (
                          <span key={tech} className="px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                            {tech}
                          </span>
                        ))}
                        {node.techStack.length > 4 && (
                          <span className="px-1.5 py-0.5 text-xs text-gray-500">
                            +{node.techStack.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-gray-400 text-xs mb-1">Key Features:</p>
                      <ul className="text-gray-300 text-xs space-y-0.5">
                        {node.features.slice(0, 2).map((feature, i) => (
                          <li key={i}>• {feature}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                      <span className="text-gray-400 text-xs">
                        {'⭐'.repeat(node.complexity)}
                      </span>
                      {node.route && (
                        <Link
                          href={node.route}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs transition-colors"
                        >
                          View Demo →
                        </Link>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Legend and Stats */}
          <div className="absolute bottom-4 left-4 flex gap-4">
            {/* Stats */}
            <div className="p-3 bg-black/80 backdrop-blur-sm rounded-lg">
              <p className="text-white text-xs font-semibold mb-1">Stats</p>
              <div className="text-gray-300 text-xs space-y-0.5">
                <p>Demos: {filteredNodes.length}/{demoNodes.length}</p>
                <p>Links: {connections.filter(c => 
                  filteredNodes.some(n => n.id === c.source) && 
                  filteredNodes.some(n => n.id === c.target)
                ).length}</p>
              </div>
            </div>

            {/* Legend */}
            <div className="p-3 bg-black/80 backdrop-blur-sm rounded-lg">
              <p className="text-white text-xs font-semibold mb-1">Connections</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-[#00D9FF]" />
                  <span className="text-gray-300 text-xs">Data</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-[#FFD700]" />
                  <span className="text-gray-300 text-xs">API</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-[#FF00FF]" />
                  <span className="text-gray-300 text-xs">Model</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-[#00FF00]" />
                  <span className="text-gray-300 text-xs">Concept</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}