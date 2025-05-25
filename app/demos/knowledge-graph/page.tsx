'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { demoNodes, connections } from './utils/demoData';
import { useKnowledgeGraphPersistence } from '@/hooks/use-knowledge-graph-persistence';
import { useMobileControls } from './hooks/useMobileControls';
import { Save, FolderOpen, Trash2, Download, Cpu, Network, Zap } from 'lucide-react';
import { GraphExportImport } from './utils/exportImport';
import { ErrorBoundary } from './components/ErrorBoundary';

// Dynamic import for 2D fallback
const KnowledgeGraph2D = dynamic(
  () => import('./components/KnowledgeGraph2D').then(mod => ({ default: mod.KnowledgeGraph2D })),
  { ssr: false }
);

// Dynamic import for 3D component to avoid SSR issues
const KnowledgeGraph3D = dynamic(
  () => import('./components/KnowledgeGraph3D').then(mod => ({ default: mod.KnowledgeGraph3D })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-cyan-400 text-lg font-mono">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 animate-pulse" />
            Loading 3D Neural Matrix...
          </div>
        </div>
      </div>
    )
  }
);

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
  const [showMobileInstructions, setShowMobileInstructions] = useState(false);
  const [supportsWebGL, setSupportsWebGL] = useState(true);

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
  
  const { isMobile: mobileControlsDetected } = useMobileControls();

  useEffect(() => {
    setIsClient(true);
    
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setSupportsWebGL(!!gl);
    } catch (e) {
      setSupportsWebGL(false);
    }
    
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      
      // Show mobile instructions on first mobile visit
      if (isMobileDevice && !localStorage.getItem('knowledgeGraph_3D_mobileInstructionsSeen')) {
        setTimeout(() => setShowMobileInstructions(true), 1000);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 text-lg font-mono">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 animate-pulse" />
            Initializing 3D Knowledge Graph Matrix...
          </div>
        </div>
      </div>
    );
  }

  const categories = ['all', ...new Set(demoNodes.map(node => node.category))];

  const handleNodeClick = (nodeId: string | null) => {
    setSelectedNode(nodeId);
    if (nodeId) {
      trackNodeClick(nodeId);
    }
  };

  // Filter nodes for counting
  const filteredNodes = demoNodes.filter(node => {
    const matchesSearch = searchTerm === '' || 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.techStack.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 overflow-hidden relative">
      {/* Background gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, #0a0a1f 0%, #000510 100%)',
          zIndex: 0
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
                  3D AI NEURAL MATRIX
                </h1>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
              <p className="text-cyan-300 text-sm font-mono hidden sm:block">
                Interactive 3D Neural Network Topology // {filteredNodes.length} NODES ACTIVE
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

        {/* Main 3D Neural Network Visualization */}
        <div className="flex-1 relative min-h-0 overflow-hidden">
          {/* 3D/2D Visualization */}
          <div className="absolute inset-0">
            <ErrorBoundary>
              {supportsWebGL ? (
                <KnowledgeGraph3D
                  selectedNode={selectedNode}
                  hoveredNode={hoveredNode}
                  onSelectNode={handleNodeClick}
                  onHoverNode={setHoveredNode}
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory}
                />
              ) : (
                <KnowledgeGraph2D
                  selectedNode={selectedNode}
                  hoveredNode={hoveredNode}
                  onSelectNode={handleNodeClick}
                  onHoverNode={setHoveredNode}
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory}
                />
              )}
            </ErrorBoundary>
          </div>

          {/* Advanced Node Information Panel */}
          {selectedNode && (
            <div className={`absolute ${isMobile ? 'bottom-0 left-0 right-0 rounded-t-xl max-h-[60vh] transform transition-transform duration-300' : 'top-4 right-4 w-96 rounded-xl max-h-[80vh]'} bg-black/95 backdrop-blur-xl border border-cyan-500/50 shadow-2xl z-30 overflow-y-auto`}>
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
                    viewMode: '3d'
                  });
                  GraphExportImport.downloadFile(json, `neural-matrix-3d-${new Date().toISOString().split('T')[0]}.json`, 'json');
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
          <div className={`absolute ${isMobile ? 'bottom-2 left-2 flex-col gap-1' : 'bottom-4 left-4 flex gap-4'} ${selectedNode && isMobile ? 'hidden' : 'flex'}`}>
            <div className={`${isMobile ? 'p-2' : 'p-3'} bg-black/70 backdrop-blur-sm rounded border border-cyan-500/30`}>
              <div className={`text-cyan-400 ${isMobile ? 'text-xs' : 'text-xs'} font-mono font-bold mb-1`}>SYSTEM STATUS</div>
              <div className={`text-cyan-300 ${isMobile ? 'text-xs' : 'text-xs'} font-mono space-y-0.5`}>
                <div>NODES: {filteredNodes.length}/{demoNodes.length}</div>
                <div>LINKS: {connections.filter(c => 
                  filteredNodes.some(n => n.id === c.source) && 
                  filteredNodes.some(n => n.id === c.target)
                ).length}</div>
                <div>MODE: {supportsWebGL ? '3D' : '2D'}</div>
              </div>
            </div>

            {!isMobile && (
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
            )}
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
                          viewMode: '3d'
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
          
          {/* Mobile Instructions Overlay */}
          {showMobileInstructions && isMobile && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-black/90 border border-cyan-500/50 p-6 rounded-xl shadow-2xl max-w-sm mx-4">
                <h3 className="text-cyan-400 font-mono font-bold mb-4 text-center">3D MOBILE CONTROLS</h3>
                <div className="space-y-3 text-cyan-300 text-sm font-mono">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400">
                      👆
                    </div>
                    <span>Tap nodes to select and view details</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400">
                      🤏
                    </div>
                    <span>Pinch to zoom in/out</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400">
                      🔄
                    </div>
                    <span>Drag to rotate the 3D view</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400">
                      ✋
                    </div>
                    <span>Two-finger drag to pan</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMobileInstructions(false);
                    localStorage.setItem('knowledgeGraph_3D_mobileInstructionsSeen', 'true');
                  }}
                  className="mt-6 w-full px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500 font-mono transition-colors"
                >
                  GOT IT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}