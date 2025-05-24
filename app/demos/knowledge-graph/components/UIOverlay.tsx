'use client';

import { useState, useEffect } from 'react';
import { GraphState, DemoNode } from '../types';
import { demoNodes, connections } from '../utils/demoData';
import { Search, Filter, X, Eye, Grid, Timeline, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface UIOverlayProps {
  graphState: GraphState;
  onStateChange: (state: GraphState) => void;
}

export function UIOverlay({ graphState, onStateChange }: UIOverlayProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const selectedNode = graphState.selectedNode 
    ? demoNodes.find(n => n.id === graphState.selectedNode)
    : null;

  // Get connected nodes
  const connectedNodes = selectedNode
    ? connections
        .filter(c => c.source === selectedNode.id || c.target === selectedNode.id)
        .map(c => c.source === selectedNode.id ? c.target : c.source)
        .map(id => demoNodes.find(n => n.id === id))
        .filter(Boolean) as DemoNode[]
    : [];

  return (
    <>
      {/* Top Controls */}
      <div className="absolute top-20 left-6 flex flex-col gap-3 pointer-events-auto">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search demos..."
            value={graphState.filter.searchTerm}
            onChange={(e) => onStateChange({
              ...graphState,
              filter: { ...graphState.filter, searchTerm: e.target.value }
            })}
            className="pl-10 bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder:text-gray-400 shadow-xl"
          />
        </div>

        {/* Filter Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20 shadow-xl"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>

        {/* View Mode Buttons */}
        <div className="flex gap-2">
          <Button
            variant={graphState.viewMode === 'default' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onStateChange({ ...graphState, viewMode: 'default' })}
            className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl hover:bg-white/20"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant={graphState.viewMode === 'matrix' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onStateChange({ ...graphState, viewMode: 'matrix' })}
            className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl hover:bg-white/20"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={graphState.viewMode === 'cluster' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onStateChange({ ...graphState, viewMode: 'cluster' })}
            className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl hover:bg-white/20"
          >
            <Layers className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="absolute top-20 left-80 p-4 bg-white/10 backdrop-blur-xl border-white/20 text-white pointer-events-auto shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Filters</h3>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowFilters(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Categories */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Categories</h4>
            <div className="flex flex-wrap gap-2">
              {['ai', 'vision', 'analysis', 'generation', 'agent', 'tools'].map(cat => (
                <Badge
                  key={cat}
                  variant={graphState.filter.categories.includes(cat) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const newCategories = graphState.filter.categories.includes(cat)
                      ? graphState.filter.categories.filter(c => c !== cat)
                      : [...graphState.filter.categories, cat];
                    onStateChange({
                      ...graphState,
                      filter: { ...graphState.filter, categories: newCategories }
                    });
                  }}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStateChange({
              ...graphState,
              filter: { categories: [], techStack: [], searchTerm: '' }
            })}
          >
            Clear All
          </Button>
        </Card>
      )}

      {/* Selected Node Info Panel */}
      {selectedNode && (
        <Card className="absolute bottom-6 right-6 p-6 max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white pointer-events-auto shadow-2xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>{selectedNode.icon}</span>
                {selectedNode.name}
              </h2>
              <Badge 
                variant="outline" 
                className={`mt-2 ${
                  selectedNode.status === 'active' ? 'border-green-500 text-green-500' :
                  selectedNode.status === 'beta' ? 'border-yellow-500 text-yellow-500' :
                  'border-red-500 text-red-500'
                }`}
              >
                {selectedNode.status}
              </Badge>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onStateChange({ ...graphState, selectedNode: null })}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-gray-300 mb-4">{selectedNode.description}</p>

          {/* Tech Stack */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {selectedNode.techStack.map(tech => (
                <Badge key={tech} variant="secondary" className="bg-white/10">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Key Features</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              {selectedNode.features.map((feature, i) => (
                <li key={i}>• {feature}</li>
              ))}
            </ul>
          </div>

          {/* Connected Demos */}
          {connectedNodes.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Connected Demos</h3>
              <div className="space-y-2">
                {connectedNodes.map(node => (
                  <div 
                    key={node.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-400"
                    onClick={() => onStateChange({ ...graphState, selectedNode: node.id })}
                  >
                    <span>{node.icon}</span>
                    <span>{node.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {selectedNode.route && (
            <div className="flex gap-2">
              <Link href={selectedNode.route} className="flex-1">
                <Button className="w-full">
                  View Demo
                </Button>
              </Link>
              <Button variant="outline">
                Learn More
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Stats */}
      <div className="absolute bottom-6 left-6 flex gap-4 text-sm text-gray-300 pointer-events-none">
        <div>
          <span className="font-semibold">{demoNodes.length}</span> Demos
        </div>
        <div>
          <span className="font-semibold">{connections.length}</span> Connections
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-6 right-6 text-sm text-gray-400 pointer-events-none">
        <p>Click nodes to explore • Drag to rotate • Scroll to zoom</p>
      </div>
    </>
  );
}