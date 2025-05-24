'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { demoNodes, connections } from './utils/demoData';
import { useKnowledgeGraphPersistence } from '@/hooks/use-knowledge-graph-persistence';
import { Save, FolderOpen, Trash2, Download, Upload, Cpu, Network, Zap } from 'lucide-react';
import { GraphExportImport } from './utils/exportImport';

export default function KnowledgeGraphPage() {
  const [isClient, setIsClient] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const {
    savedStates,
    isLoading,
    saveCurrentState,
    loadState,
    deleteState,
    trackNodeClick,
    trackSearch,
    trackFilterUsage
  } = useKnowledgeGraphPersistence();

  // Particle system for sci-fi background
  const particles = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    size: number;
  }>>([]);

  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Initialize particles
    initParticles();
    animate();
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const initParticles = () => {
    particles.current = [];
    const count = isMobile ? 30 : 60;
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.5 + 0.2,
        size: Math.random() * 2 + 1
      });
    }
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particles.current.forEach(particle => {
      particle.x += particle.vx * animationSpeed;
      particle.y += particle.vy * animationSpeed;

      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = '#00D9FF';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw connections between nearby particles
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.current.length; i++) {
      for (let j = i + 1; j < particles.current.length; j++) {
        const p1 = particles.current[i];
        const p2 = particles.current[j];
        const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
        
        if (distance < 100) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  if (!isClient) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 text-lg font-mono">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 animate-pulse" />
            Initializing Knowledge Graph Matrix...
          </div>
        </div>
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

  // Calculate positions for filtered nodes with better spacing
  const nodePositions = filteredNodes.map((node, index) => {
    // Custom positioning for specific nodes to avoid overlaps
    const customPositions: { [key: string]: { x: number; y: number } } = {
      'financial-assistant': { x: 20, y: 25 },
      'computer-vision': { x: 80, y: 25 },
      'chess-ai': { x: 25, y: 60 }, // Moved left to avoid overlap
      'generative-ai': { x: 75, y: 75 },
      'sales-agent': { x: 80, y: 50 },
      'interactive-agents': { x: 50, y: 45 }, // Centered to avoid overlap
      'youtube-summarizer': { x: 15, y: 80 },
      'data-analyst': { x: 85, y: 80 },
      'enhanced-rag': { x: 50, y: 75 } // Moved down to avoid overlap with multi-agent
    };

    if (customPositions[node.id]) {
      return { ...node, ...customPositions[node.id] };
    }

    // Fallback to circular arrangement for any additional nodes
    const totalNodes = filteredNodes.length;
    const angle = (2 * Math.PI * index) / totalNodes;
    const radius = isMobile ? 25 : 30;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    return { ...node, x, y };
  });

  const categories = ['all', ...new Set(demoNodes.map(node => node.category))];

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
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 overflow-hidden relative">
      {/* Animated Background Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          zIndex: 2
        }}
      />

      <div className="h-full flex flex-col relative" style={{ zIndex: 3 }}>
        {/* Futuristic Header */}
        <div className="flex-shrink-0 p-4 bg-black/50 backdrop-blur-xl border-b border-cyan-500/30">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <Network className="w-8 h-8 text-cyan-400" />
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-mono">
                  AI NEURAL MATRIX
                </h1>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
              <p className="text-cyan-300 text-sm font-mono hidden sm:block">
                Interactive Neural Network Topology // {filteredNodes.length} NODES ACTIVE
              </p>
            </div>
            
            {/* Cyberpunk Search Controls */}
            <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="SEARCH NEURAL NODES..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value) {
                      trackSearch(e.target.value);
                    }
                  }}
                  className="px-4 py-2 bg-black/70 text-cyan-400 text-sm rounded border border-cyan-500/50 focus:border-cyan-400 focus:outline-none transition-all placeholder-cyan-600 font-mono w-full sm:w-48 lg:w-64"
                />
                <Zap className="absolute right-3 top-2.5 w-4 h-4 text-cyan-500" />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  trackFilterUsage(e.target.value);
                }}
                className="px-4 py-2 bg-black/70 text-cyan-400 text-sm rounded border border-cyan-500/50 focus:border-cyan-400 focus:outline-none transition-all font-mono w-full sm:w-auto"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-black">
                    {cat === 'all' ? 'ALL SYSTEMS' : cat.toUpperCase().replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {filteredNodes.length === 0 && (
            <div className="mt-3 p-3 bg-red-900/20 border border-red-500/50 rounded">
              <p className="text-red-400 text-xs font-mono">// NO MATCHING NEURAL PATTERNS DETECTED</p>
            </div>
          )}
        </div>

        {/* Main Neural Network Visualization */}
        <div className="flex-1 relative min-h-0">
          <div className="absolute inset-0 overflow-hidden">
            {/* Connection Grid */}
            <svg className="absolute inset-0 w-full h-full">
              {connections.map(conn => {
                const source = nodePositions.find(n => n.id === conn.source);
                const target = nodePositions.find(n => n.id === conn.target);
                if (!source || !target) return null;

                const isHighlighted = selectedNode === conn.source || selectedNode === conn.target;
                const opacity = selectedNode ? (isHighlighted ? 0.9 : 0.1) : 0.4;

                return (
                  <g key={conn.id}>
                    <defs>
                      <linearGradient id={`gradient-${conn.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={conn.type === 'data' ? '#00D9FF' : 
                                   conn.type === 'api' ? '#FFD700' :
                                   conn.type === 'model' ? '#FF00FF' : '#00FF00'} />
                        <stop offset="100%" stopColor={conn.type === 'data' ? '#0099CC' : 
                                   conn.type === 'api' ? '#CCB000' :
                                   conn.type === 'model' ? '#CC00CC' : '#00CC00'} />
                      </linearGradient>
                    </defs>
                    <line
                      x1={`${source.x}%`}
                      y1={`${source.y}%`}
                      x2={`${target.x}%`}
                      y2={`${target.y}%`}
                      stroke={`url(#gradient-${conn.id})`}
                      strokeWidth={isHighlighted ? 3 : 1}
                      opacity={opacity}
                      className="transition-all duration-500"
                      style={{
                        filter: isHighlighted ? 'drop-shadow(0 0 6px currentColor)' : 'none'
                      }}
                    />
                    {isHighlighted && (
                      <circle
                        cx={`${source.x + (target.x - source.x) * 0.5}%`}
                        cy={`${source.y + (target.y - source.y) * 0.5}%`}
                        r="3"
                        fill={conn.type === 'data' ? '#00D9FF' : 
                             conn.type === 'api' ? '#FFD700' :
                             conn.type === 'model' ? '#FF00FF' : '#00FF00'}
                        className="animate-pulse"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Neural Nodes */}
            {nodePositions.map(node => {
              const isSelected = selectedNode === node.id;
              const isHovered = hoveredNode === node.id;
              const isConnected = connectedNodes.has(node.id);
              const shouldHighlight = isSelected || isConnected || !selectedNode;

              return (
                <div
                  key={node.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out group"
                  style={{ 
                    left: `${node.x}%`, 
                    top: `${node.y}%`,
                    opacity: shouldHighlight ? 1 : 0.3,
                    transform: `translate(-50%, -50%) scale(${isSelected ? 1.3 : isHovered ? 1.15 : 1})`,
                    zIndex: isSelected ? 20 : isHovered ? 15 : 10
                  }}
                  onMouseEnter={() => !isMobile && setHoveredNode(node.id)}
                  onMouseLeave={() => !isMobile && setHoveredNode(null)}
                  onTouchStart={() => isMobile && setHoveredNode(node.id)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    if (isMobile) {
                      setSelectedNode(selectedNode === node.id ? null : node.id);
                      trackNodeClick(node.id);
                      setHoveredNode(null);
                    }
                  }}
                  onClick={() => {
                    if (!isMobile) {
                      setSelectedNode(selectedNode === node.id ? null : node.id);
                      trackNodeClick(node.id);
                    }
                  }}
                >
                  {/* Node Core */}
                  <div 
                    className={`relative ${isMobile ? 'w-24 h-24' : 'w-20 h-20'} rounded-full flex items-center justify-center cursor-pointer transition-all duration-500`}
                    style={{ 
                      background: `
                        radial-gradient(circle at 30% 30%, ${node.color}40, ${node.color}),
                        conic-gradient(from 0deg, ${node.color}, ${node.color}80, ${node.color})
                      `,
                      boxShadow: `
                        0 0 20px ${node.color}60,
                        inset 0 0 20px ${node.color}20,
                        ${isSelected ? `0 0 40px ${node.color}, 0 0 60px ${node.color}50` : ''}
                      `,
                      border: `2px solid ${node.color}80`
                    }}
                  >
                    {/* Pulsing Ring */}
                    {(isSelected || isHovered) && (
                      <div 
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{
                          border: `2px solid ${node.color}60`,
                          animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                        }}
                      />
                    )}
                    
                    {/* Icon */}
                    <span className="text-3xl relative z-10 filter drop-shadow-lg">
                      {node.icon}
                    </span>
                    
                    {/* Status Indicator */}
                    <div 
                      className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-black ${
                        node.status === 'active' ? 'bg-green-400' : 
                        node.status === 'beta' ? 'bg-yellow-400' : 'bg-red-400'
                      } shadow-lg`}
                      style={{
                        boxShadow: `0 0 10px ${
                          node.status === 'active' ? '#10B981' : 
                          node.status === 'beta' ? '#F59E0B' : '#EF4444'
                        }`
                      }}
                    />

                    {/* Complexity Rings */}
                    {Array.from({ length: node.complexity }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full border opacity-30"
                        style={{
                          width: `${100 + (i + 1) * 15}%`,
                          height: `${100 + (i + 1) * 15}%`,
                          borderColor: node.color,
                          animation: `spin ${20 + i * 5}s linear infinite ${isSelected ? '' : 'paused'}`
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Node Label */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
                    <div 
                      className="px-3 py-1 rounded-full text-xs font-mono font-bold backdrop-blur-sm border"
                      style={{
                        background: `linear-gradient(45deg, ${node.color}20, ${node.color}10)`,
                        borderColor: `${node.color}40`,
                        color: node.color,
                        textShadow: `0 0 10px ${node.color}`
                      }}
                    >
                      {node.name.length > 18 ? node.name.substring(0, 18) + '...' : node.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Advanced Node Information Panel */}
          {selectedNode && (
            <div className={`absolute ${isMobile ? 'bottom-0 left-0 right-0 rounded-t-xl max-h-[50vh]' : 'top-4 right-4 w-96 rounded-xl max-h-[80vh]'} bg-black/95 backdrop-blur-xl border border-cyan-500/50 shadow-2xl z-30 overflow-y-auto`}>
              {(() => {
                const node = demoNodes.find(n => n.id === selectedNode);
                if (!node) return null;
                
                return (
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{node.icon}</span>
                        <div>
                          <h3 className="text-xl font-bold text-cyan-400 font-mono">
                            {node.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded font-mono ${
                              node.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 
                              node.status === 'beta' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 
                              'bg-red-500/20 text-red-400 border border-red-500/50'
                            }`}>
                              {node.status.toUpperCase()}
                            </span>
                            <span className="text-cyan-600 text-xs font-mono">
                              COMPLEXITY: {'⬢'.repeat(node.complexity)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="text-cyan-400 hover:text-white transition-colors p-1"
                      >
                        <div className="w-6 h-6 rounded-full border border-cyan-500/50 flex items-center justify-center text-xs font-mono">
                          ✕
                        </div>
                      </button>
                    </div>
                    
                    {/* Description */}
                    <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded">
                      <p className="text-cyan-300 text-sm font-mono leading-relaxed">
                        {node.description}
                      </p>
                    </div>
                    
                    {/* Tech Stack */}
                    <div className="mb-4">
                      <h4 className="text-cyan-400 text-sm font-mono font-bold mb-2 flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        NEURAL ARCHITECTURE
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {node.techStack.map((tech, i) => (
                          <div 
                            key={i} 
                            className="px-2 py-1 bg-gray-800/50 border border-gray-600/50 rounded text-xs text-gray-300 font-mono hover:border-cyan-500/50 transition-colors"
                          >
                            {tech}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-4">
                      <h4 className="text-cyan-400 text-sm font-mono font-bold mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        CORE CAPABILITIES
                      </h4>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {node.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                            <span className="text-cyan-300 font-mono">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-cyan-500/30">
                      <div className="text-cyan-600 text-xs font-mono">
                        NODE.ID: {node.id.toUpperCase()}
                      </div>
                      {node.route && (
                        <Link
                          href={node.route}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded font-mono text-sm hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg hover:shadow-cyan-500/25"
                        >
                          INITIALIZE →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Control Panel */}
          {!isMobile && (
            <div className="absolute top-4 left-4 flex gap-2">
              {[
                { icon: Save, action: () => setShowSaveDialog(true), title: "Save State" },
                { icon: FolderOpen, action: () => setShowLoadDialog(true), title: "Load State" },
                { icon: Download, action: () => {
                  const json = GraphExportImport.exportToJSON({
                    selectedNode,
                    filter: { categories: [selectedCategory], techStack: [], searchTerm },
                    viewMode: 'default'
                  });
                  GraphExportImport.downloadFile(json, `neural-matrix-${new Date().toISOString().split('T')[0]}.json`, 'json');
                }, title: "Export Data" }
              ].map(({ icon: Icon, action, title }, i) => (
                <button
                  key={i}
                  onClick={action}
                  className="p-3 bg-black/70 backdrop-blur-sm rounded border border-cyan-500/50 text-cyan-400 hover:text-white hover:border-cyan-400 transition-all group"
                  title={title}
                >
                  <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              ))}
            </div>
          )}

          {/* System Status */}
          <div className={`absolute ${isMobile ? 'bottom-4 left-2 flex-col gap-2' : 'bottom-4 left-4 flex gap-4'} ${selectedNode && isMobile ? 'hidden' : 'flex'}`}>
            <div className="p-3 bg-black/70 backdrop-blur-sm rounded border border-cyan-500/30">
              <div className="text-cyan-400 text-xs font-mono font-bold mb-1">SYSTEM STATUS</div>
              <div className="text-cyan-300 text-xs font-mono space-y-0.5">
                <div>NODES: {filteredNodes.length}/{demoNodes.length}</div>
                <div>LINKS: {connections.filter(c => 
                  filteredNodes.some(n => n.id === c.source) && 
                  filteredNodes.some(n => n.id === c.target)
                ).length}</div>
              </div>
            </div>

            <div className="p-3 bg-black/70 backdrop-blur-sm rounded border border-cyan-500/30">
              <div className="text-cyan-400 text-xs font-mono font-bold mb-1">DATA STREAMS</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'DATA', color: '#00D9FF' },
                  { name: 'API', color: '#FFD700' },
                  { name: 'AI', color: '#FF00FF' },
                  { name: 'SYS', color: '#00FF00' }
                ].map(({ name, color }) => (
                  <div key={name} className="flex items-center gap-1">
                    <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
                    <span className="text-xs font-mono" style={{ color }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Save Dialog */}
          {showSaveDialog && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40">
              <div className="bg-black/90 border border-cyan-500/50 p-6 rounded-xl shadow-2xl">
                <h3 className="text-cyan-400 font-mono font-bold mb-4">SAVE NEURAL STATE</h3>
                <input
                  type="text"
                  placeholder="Enter state identifier..."
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 text-cyan-400 rounded border border-cyan-500/50 mb-4 font-mono"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (saveName) {
                        await saveCurrentState(saveName, {
                          selectedNode,
                          filter: { categories: [selectedCategory], techStack: [], searchTerm },
                          viewMode: 'default'
                        });
                        setShowSaveDialog(false);
                        setSaveName('');
                      }
                    }}
                    disabled={!saveName || isLoading}
                    className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500 disabled:opacity-50 font-mono"
                  >
                    EXECUTE
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveDialog(false);
                      setSaveName('');
                    }}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 font-mono"
                  >
                    ABORT
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Load Dialog */}
          {showLoadDialog && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40">
              <div className="bg-black/90 border border-cyan-500/50 p-6 rounded-xl shadow-2xl max-w-md w-full max-h-96 overflow-y-auto">
                <h3 className="text-cyan-400 font-mono font-bold mb-4">LOAD NEURAL STATE</h3>
                {savedStates.length === 0 ? (
                  <p className="text-cyan-600 text-sm font-mono">// NO SAVED STATES DETECTED</p>
                ) : (
                  <div className="space-y-2">
                    {savedStates.map(state => (
                      <div key={state.id} className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-600/50 rounded">
                        <div>
                          <p className="text-cyan-400 font-mono font-medium">{state.name}</p>
                          <p className="text-cyan-600 text-xs font-mono">
                            {new Date(state.updated_at || '').toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const loadedState = await loadState(state.id!);
                              if (loadedState) {
                                setSelectedNode(loadedState.selectedNode);
                                setSearchTerm(loadedState.filter.searchTerm);
                                setSelectedCategory(loadedState.filter.categories[0] || 'all');
                                setShowLoadDialog(false);
                              }
                            }}
                            className="px-2 py-1 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-500 font-mono"
                          >
                            LOAD
                          </button>
                          <button
                            onClick={() => deleteState(state.id!)}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowLoadDialog(false)}
                  className="mt-4 w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 font-mono"
                >
                  CLOSE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}