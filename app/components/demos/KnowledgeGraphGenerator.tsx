"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRightIcon, BookOpenIcon, SearchIcon, LoaderIcon } from "lucide-react"

// Types for our graph nodes and edges
type Node = {
  id: string
  label: string
  type: "entity" | "concept" | "event"
  size?: number
}

type Edge = {
  source: string
  target: string
  label: string
}

type Graph = {
  nodes: Node[]
  edges: Edge[]
}

// Sample preset graphs based on different inputs
const sampleGraphs: Record<string, Graph> = {
  "artificial intelligence": {
    nodes: [
      { id: "1", label: "Artificial Intelligence", type: "concept", size: 25 },
      { id: "2", label: "Machine Learning", type: "concept", size: 20 },
      { id: "3", label: "Neural Networks", type: "concept", size: 18 },
      { id: "4", label: "Deep Learning", type: "concept", size: 18 },
      { id: "5", label: "Computer Vision", type: "concept", size: 15 },
      { id: "6", label: "Natural Language Processing", type: "concept", size: 15 },
      { id: "7", label: "Reinforcement Learning", type: "concept", size: 15 },
      { id: "8", label: "Alan Turing", type: "entity", size: 12 },
      { id: "9", label: "Turing Test", type: "concept", size: 10 },
      { id: "10", label: "ImageNet", type: "concept", size: 8 },
    ],
    edges: [
      { source: "1", target: "2", label: "includes" },
      { source: "2", target: "3", label: "uses" },
      { source: "2", target: "7", label: "includes" },
      { source: "3", target: "4", label: "enables" },
      { source: "1", target: "5", label: "application" },
      { source: "1", target: "6", label: "application" },
      { source: "4", target: "5", label: "powers" },
      { source: "4", target: "6", label: "powers" },
      { source: "8", target: "9", label: "created" },
      { source: "1", target: "9", label: "evaluated by" },
      { source: "5", target: "10", label: "trained on" },
    ]
  },
  "climate change": {
    nodes: [
      { id: "1", label: "Climate Change", type: "concept", size: 25 },
      { id: "2", label: "Global Warming", type: "concept", size: 20 },
      { id: "3", label: "Greenhouse Gases", type: "concept", size: 18 },
      { id: "4", label: "Carbon Dioxide", type: "entity", size: 15 },
      { id: "5", label: "Methane", type: "entity", size: 15 },
      { id: "6", label: "Fossil Fuels", type: "concept", size: 15 },
      { id: "7", label: "Renewable Energy", type: "concept", size: 15 },
      { id: "8", label: "Paris Agreement", type: "event", size: 12 },
      { id: "9", label: "Sea Level Rise", type: "concept", size: 10 },
      { id: "10", label: "Extreme Weather", type: "concept", size: 10 },
    ],
    edges: [
      { source: "1", target: "2", label: "causes" },
      { source: "2", target: "3", label: "caused by" },
      { source: "3", target: "4", label: "includes" },
      { source: "3", target: "5", label: "includes" },
      { source: "6", target: "4", label: "produces" },
      { source: "1", target: "9", label: "causes" },
      { source: "1", target: "10", label: "increases" },
      { source: "8", target: "1", label: "addresses" },
      { source: "7", target: "6", label: "replaces" },
      { source: "7", target: "4", label: "reduces" },
    ]
  },
  "world war ii": {
    nodes: [
      { id: "1", label: "World War II", type: "event", size: 25 },
      { id: "2", label: "Adolf Hitler", type: "entity", size: 18 },
      { id: "3", label: "Nazi Germany", type: "entity", size: 18 },
      { id: "4", label: "Allied Powers", type: "concept", size: 18 },
      { id: "5", label: "Axis Powers", type: "concept", size: 18 },
      { id: "6", label: "Pearl Harbor", type: "event", size: 15 },
      { id: "7", label: "D-Day", type: "event", size: 15 },
      { id: "8", label: "Holocaust", type: "event", size: 15 },
      { id: "9", label: "Atomic Bomb", type: "entity", size: 15 },
      { id: "10", label: "United Nations", type: "entity", size: 12 },
    ],
    edges: [
      { source: "2", target: "3", label: "led" },
      { source: "3", target: "5", label: "part of" },
      { source: "1", target: "6", label: "included" },
      { source: "1", target: "7", label: "included" },
      { source: "1", target: "8", label: "included" },
      { source: "3", target: "8", label: "perpetrated" },
      { source: "4", target: "5", label: "fought against" },
      { source: "1", target: "9", label: "ended with" },
      { source: "1", target: "10", label: "led to formation of" },
      { source: "6", target: "1", label: "brought US into" },
    ]
  }
}

// Default graph to show before user input
const defaultGraph: Graph = {
  nodes: [
    { id: "1", label: "Knowledge Graph", type: "concept", size: 20 },
    { id: "2", label: "Entities", type: "concept", size: 15 },
    { id: "3", label: "Relationships", type: "concept", size: 15 },
    { id: "4", label: "Text", type: "concept", size: 15 },
  ],
  edges: [
    { source: "1", target: "2", label: "contains" },
    { source: "1", target: "3", label: "defines" },
    { source: "4", target: "1", label: "generates" },
    { source: "2", target: "3", label: "connected by" },
  ]
}

export default function KnowledgeGraphGenerator() {
  const [inputText, setInputText] = useState("")
  const [graph, setGraph] = useState<Graph>(defaultGraph)
  const [loading, setLoading] = useState(false)
  const [processed, setProcessed] = useState(false)

  // Position nodes in a radial layout for visualization
  const nodePositions = calculateNodePositions(graph.nodes)
  
  // Get sample suggestions
  const suggestions = Object.keys(sampleGraphs)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputText.trim()) return
    
    setLoading(true)
    
    // Simulate API call with a delay
    setTimeout(() => {
      // Check if we have a preset for this input (case insensitive)
      const normalizedInput = inputText.toLowerCase().trim()
      
      const matchedSample = Object.entries(sampleGraphs).find(([key]) => 
        normalizedInput.includes(key)
      )
      
      if (matchedSample) {
        setGraph(matchedSample[1])
      } else {
        // Generate a random graph structure if no match
        setGraph(generateRandomGraph(inputText))
      }
      
      setLoading(false)
      setProcessed(true)
    }, 1500)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion)
    setGraph(sampleGraphs[suggestion])
    setProcessed(true)
  }

  // Generate a random graph based on text (fallback for non-presets)
  function generateRandomGraph(text: string): Graph {
    const words = text
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 8)
    
    if (words.length === 0) {
      return defaultGraph
    }
    
    const nodes: Node[] = words.map((word, index) => ({
      id: (index + 1).toString(),
      label: word.charAt(0).toUpperCase() + word.slice(1),
      type: ["entity", "concept", "event"][Math.floor(Math.random() * 3)] as Node["type"],
      size: Math.random() * 10 + 10
    }))
    
    const edges: Edge[] = []
    const relations = ["related to", "causes", "part of", "defines", "type of", "example of"]
    
    // Connect nodes with random edges
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        source: nodes[i].id,
        target: nodes[i + 1].id,
        label: relations[Math.floor(Math.random() * relations.length)]
      })
      
      // Add some cross connections for complexity
      if (i < nodes.length - 2 && Math.random() > 0.5) {
        edges.push({
          source: nodes[i].id,
          target: nodes[i + 2].id,
          label: relations[Math.floor(Math.random() * relations.length)]
        })
      }
    }
    
    return { nodes, edges }
  }

  return (
    <div className="p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Enter text to generate a knowledge graph</h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter a topic, paragraph, or article to extract a knowledge graph..."
              className="w-full p-3 pr-10 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 resize-none h-24"
            />
            <SearchIcon className="absolute right-3 top-3 text-neutral-400" size={20} />
          </div>
          
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="flex items-center justify-center gap-2 bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoaderIcon className="animate-spin" size={20} />
                <span>Generating Graph...</span>
              </>
            ) : (
              <>
                <ArrowRightIcon size={20} />
                <span>Generate Knowledge Graph</span>
              </>
            )}
          </button>
        </form>
        
        {/* Quick suggestions */}
        <div className="mt-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-sm bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 px-3 py-1 rounded-full flex items-center gap-1"
              >
                <BookOpenIcon size={14} />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Knowledge Graph Visualization */}
      <div className="relative mt-6 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-900">
        <div className="absolute top-4 left-4">
          <span className="text-sm font-medium bg-white dark:bg-neutral-800 px-3 py-1 rounded-full shadow-sm">
            {processed 
              ? `Knowledge graph for "${inputText.substring(0, 30)}${inputText.length > 30 ? '...' : ''}"`
              : "Sample knowledge graph"}
          </span>
        </div>
        
        <div className="h-80 relative">
          {/* SVG Graph Visualization */}
          <svg width="100%" height="100%" className="p-10">
            {/* Edges */}
            {graph.edges.map((edge) => {
              const source = nodePositions[edge.source]
              const target = nodePositions[edge.target]
              
              if (!source || !target) return null
              
              // Calculate midpoint for label
              const midX = (source.x + target.x) / 2
              const midY = (source.y + target.y) / 2
              
              return (
                <g key={`${edge.source}-${edge.target}`}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="currentColor"
                    strokeOpacity={0.4}
                    strokeWidth={1.5}
                    className="text-neutral-400 dark:text-neutral-500"
                  />
                  
                  {/* Edge label */}
                  <foreignObject
                    x={midX - 40}
                    y={midY - 10}
                    width={80}
                    height={20}
                    className="overflow-visible"
                  >
                    <div className="text-[10px] text-center p-1 bg-white dark:bg-neutral-800 rounded-sm shadow-sm text-neutral-500 dark:text-neutral-400">
                      {edge.label}
                    </div>
                  </foreignObject>
                </g>
              )
            })}
            
            {/* Nodes */}
            {graph.nodes.map((node) => {
              const position = nodePositions[node.id]
              if (!position) return null
              
              const nodeSize = node.size || 15
              let nodeColor = "text-blue-500 dark:text-blue-400"
              
              if (node.type === "entity") {
                nodeColor = "text-green-500 dark:text-green-400"
              } else if (node.type === "event") {
                nodeColor = "text-red-500 dark:text-red-400"
              }
              
              return (
                <g key={node.id}>
                  <motion.circle
                    cx={position.x}
                    cy={position.y}
                    r={nodeSize}
                    className={`${nodeColor} fill-current`}
                    fillOpacity={0.2}
                    strokeWidth={2}
                    stroke="currentColor"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: Number(node.id) * 0.05 }}
                  />
                  
                  <foreignObject
                    x={position.x - 50}
                    y={position.y - 10}
                    width={100}
                    height={20}
                    className="overflow-visible"
                  >
                    <div className="text-center text-xs font-medium">
                      {node.label}
                    </div>
                  </foreignObject>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
        <p>
          <strong>About this demo:</strong> This simulates a knowledge graph generator that extracts entities, concepts, and relationships from text. 
          In a real implementation, this would use NLP techniques like named entity recognition, relation extraction, and coreference resolution.
        </p>
      </div>
    </div>
  )
}

// Calculate positions for nodes in a radial layout
function calculateNodePositions(nodes: Node[]) {
  const centerX = 400
  const centerY = 200
  const radius = 150
  
  const positions: Record<string, { x: number, y: number }> = {}
  
  // Position nodes in a circle
  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI
    positions[node.id] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    }
  })
  
  return positions
} 