# AI Portfolio Knowledge Graph

An advanced 3D visualization showcasing the interconnected nature of AI demos in the portfolio. Built with React Three Fiber, this interactive knowledge graph demonstrates relationships between various AI technologies through stunning visual effects and smooth animations.

## 🌟 Features

### 3D Visualization
- **Dynamic Node System**: Each demo represented as a unique 3D geometry based on its category
- **Animated Connections**: Particle streams flowing along curved paths showing data relationships
- **Post-processing Effects**: Bloom, depth of field, chromatic aberration for a futuristic aesthetic
- **Interactive Controls**: Orbit, zoom, and click to explore the graph

### Performance Optimizations
- **LOD (Level of Detail)**: Nodes adjust complexity based on camera distance
- **Frustum Culling**: Only renders visible nodes for better performance
- **Instanced Particles**: Efficient particle system using GPU instancing
- **Adaptive Quality**: Automatic detection and fallback for low-end devices
- **Mobile Support**: Touch controls and simplified rendering for mobile devices

### User Interface
- **Glassmorphism Panels**: Modern UI with backdrop blur effects
- **Search & Filter**: Find demos by name, technology, or category
- **Detailed Information**: Click nodes to view tech stack, features, and connections
- **Multiple View Modes**: Default, matrix, and cluster views (coming soon)

### Animations
- **Load Sequence**: Nodes appear sequentially with scaling animations
- **Idle Animations**: Gentle rotation and floating effects
- **Hover Effects**: Scale and glow on mouse over
- **Selection Orbit**: Camera focuses on selected nodes
- **Connection Flow**: Animated particles along relationship paths

## 🚀 Technical Stack

- **React Three Fiber**: 3D rendering with React
- **Three.js**: WebGL-based 3D graphics
- **@react-three/drei**: Helper components and utilities
- **@react-three/postprocessing**: Visual effects pipeline
- **react-spring**: Physics-based animations
- **TypeScript**: Full type safety
- **Tailwind CSS**: Styling with glassmorphism effects

## 📁 Project Structure

```
app/demos/knowledge-graph/
├── components/
│   ├── GraphScene.tsx          # Main 3D scene setup
│   ├── GraphNodes.tsx          # Node management with frustum culling
│   ├── GraphConnections.tsx    # Connection line rendering
│   ├── DemoNode.tsx            # Individual node component
│   ├── ConnectionLine.tsx      # Animated connection paths
│   ├── InstancedParticles.tsx  # Optimized particle system
│   ├── UIOverlay.tsx           # User interface overlay
│   ├── SimplifiedGraph.tsx     # Low-end device fallback
│   ├── LoadSequence.tsx        # Initial load animations
│   ├── ErrorBoundary.tsx       # Error handling
│   └── LoadingSpinner.tsx      # Loading state
├── hooks/
│   ├── usePerformance.ts       # Performance monitoring
│   └── useMobileControls.ts    # Touch controls
├── types/
│   └── index.ts                # TypeScript definitions
├── utils/
│   └── demoData.ts             # Demo nodes and connections data
├── page.tsx                    # Main page component
├── layout.tsx                  # Layout wrapper
└── README.md                   # This file
```

## 🎯 Demos Included

1. **Financial Market Assistant** - Real-time financial analysis with RAG
2. **Computer Vision Assistant** - AI-powered visual data analysis
3. **Advanced Chess AI Engine** - Neural network chess with reinforcement learning
4. **Generative AI** - Text and image generation
5. **AI Sales Agent** - OpenAI-powered sales conversations
6. **Interactive AI Agents** - Multi-agent collaboration
7. **YouTube Summarizer** - Video content extraction
8. **AI Data Analyst** - Complex dataset analysis
9. **Enhanced RAG** - Advanced retrieval-augmented generation

## 🔧 Performance Features

### Level of Detail (LOD)
- High detail: Full geometry + particles (< 10 units)
- Medium detail: Simplified geometry (10-20 units)
- Low detail: Basic shapes (20-30 units)
- Billboard: 2D representation (> 30 units)

### Frustum Culling
- Only renders nodes within camera view
- Always renders selected/hovered nodes
- Significant performance boost for large graphs

### Device Detection
- Automatic GPU capability detection
- Mobile device detection
- Memory usage monitoring
- Fallback to simplified graph when needed

## 🎨 Visual Effects

- **Bloom**: Glowing effects on active elements
- **Depth of Field**: Focus blur for depth perception
- **Chromatic Aberration**: Subtle color fringing
- **Vignette**: Darkened edges for focus
- **Particle Systems**: Flowing data visualization

## 📱 Mobile Support

- Touch controls for rotation and zoom
- Simplified rendering for better performance
- Responsive UI adapting to screen size
- Automatic quality adjustment

## 🔍 Search & Filter

- Real-time search by demo name
- Filter by category (AI, Vision, Analysis, etc.)
- Filter by technology stack
- Highlight matching nodes

## 🚦 Error Handling

- Comprehensive error boundaries
- Graceful fallback UI
- WebGL compatibility checking
- Performance monitoring

## 🔮 Future Enhancements

- [ ] AI-powered node recommendations
- [ ] Real-time collaboration features
- [ ] Data persistence and sharing
- [ ] VR/AR mode support
- [ ] Advanced clustering algorithms
- [ ] Timeline view animation
- [ ] Export graph as image

## 🏃 Getting Started

```bash
# Navigate to the demo
cd app/demos/knowledge-graph

# Install dependencies (from root)
npm install

# Run development server
npm run dev

# Visit http://localhost:3000/demos/knowledge-graph
```

## 🎮 Controls

- **Left Click + Drag**: Rotate graph
- **Right Click + Drag**: Pan camera
- **Scroll**: Zoom in/out
- **Click Node**: View details
- **Double Click**: Focus on node
- **Search**: Find specific demos
- **Filter**: Show/hide categories

## 📈 Performance Tips

- Use Chrome/Edge for best WebGL performance
- Close other GPU-intensive applications
- Reduce particle count on slower devices
- Use simplified mode on mobile

## 🤝 Contributing

Feel free to enhance the knowledge graph with:
- New visual effects
- Additional animations
- Performance optimizations
- New interaction modes
- Better mobile support

## 📄 License

Part of the AI Portfolio project. All rights reserved.