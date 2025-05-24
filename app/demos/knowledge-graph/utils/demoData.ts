import { DemoNode, Connection } from '../types';

export const demoNodes: DemoNode[] = [
  {
    id: 'financial-assistant',
    name: 'Financial Market Assistant',
    description: 'Real-time financial analysis, market insights, investment advice with RAG capabilities',
    category: 'analysis',
    position: [-3, 2, 0],
    color: '#00D9FF',
    icon: '💹',
    size: 1.2,
    techStack: [
      'OpenAI GPT-4', 'Supabase PostgreSQL', 'pgvector', 'LangChain', 'Chart.js', 
      'Yahoo Finance API', 'Alpha Vantage API', 'React', 'TypeScript', 'Next.js 15',
      'Tailwind CSS', 'Framer Motion', 'WebSockets', 'Server-Sent Events'
    ],
    features: ['Real-time market data streaming', 'AI-powered market analysis', 'Investment recommendations', 'News sentiment analysis', 'Portfolio optimization', 'Risk assessment'],
    complexity: 5,
    status: 'active',
    route: '/demos/financial-assistant'
  },
  {
    id: 'computer-vision',
    name: 'Computer Vision Assistant',
    description: 'Analyze and interpret visual data with AI-powered vision system',
    category: 'vision',
    position: [3, 2, 0],
    color: '#FF00FF',
    icon: '🔬',
    size: 1.1,
    techStack: [
      'Hugging Face Transformers', 'BLIP-2', 'Segment Anything Model (SAM)', 'LLaVA', 
      'OpenCV', 'TensorFlow.js', 'Canvas API', 'WebGL', 'Google Gemini Vision',
      'React', 'TypeScript', 'Next.js 15', 'Tailwind CSS', 'Web Workers'
    ],
    features: ['Multi-modal image analysis', 'Real-time object detection', 'Semantic segmentation', 'Visual question answering', 'Image inpainting', 'OCR capabilities'],
    complexity: 5,
    status: 'active',
    route: '/demos/computer-vision-assistant'
  },
  {
    id: 'chess-ai',
    name: 'Advanced Chess AI Engine',
    description: 'Neural network chess engine with deep reinforcement learning',
    category: 'ai',
    position: [0, 4, 0],
    color: '#FFD700',
    icon: '🧠',
    size: 1.0,
    techStack: [
      'ONNX Runtime', 'TensorFlow.js', 'Three.js', 'React Three Fiber', 'Chess.js',
      'Web Workers', 'AlphaZero Algorithm', 'Monte Carlo Tree Search', 'Neural Networks',
      'WebAssembly', 'TypeScript', 'React', 'Next.js 15', 'Tailwind CSS'
    ],
    features: ['Deep neural network evaluation', 'Monte Carlo tree search', 'Real-time 3D visualization', 'Opening book database', 'Position analysis', 'Game replay system'],
    complexity: 5,
    status: 'active',
    route: '/demos/chess-ai-magnus'
  },
  {
    id: 'generative-ai',
    name: 'Generative AI Studio',
    description: 'Create unique text and images using cutting-edge generative AI models',
    category: 'generation',
    position: [-2, -2, 2],
    color: '#FF6B6B',
    icon: '✨',
    size: 1.0,
    techStack: [
      'OpenAI GPT-4', 'DALL-E 3', 'Stable Diffusion XL', 'Midjourney API',
      'Hugging Face Diffusers', 'LangChain', 'Prompt Engineering',
      'React', 'TypeScript', 'Next.js 15', 'Tailwind CSS', 'Framer Motion'
    ],
    features: ['Advanced text generation', 'High-quality image synthesis', 'Style transfer', 'Prompt optimization', 'Multi-modal content creation', 'Creative workflows'],
    complexity: 4,
    status: 'active',
    route: '/demos/generative-ai'
  },
  {
    id: 'sales-agent',
    name: 'AI Sales Agent',
    description: 'Intelligent sales conversation agent with advanced NLP capabilities',
    category: 'agent',
    position: [2, -2, 2],
    color: '#4ECDC4',
    icon: '🤖',
    size: 0.9,
    techStack: [
      'OpenAI GPT-4', 'Supabase', 'Function Calling', 'Streaming APIs',
      'Natural Language Processing', 'Sentiment Analysis', 'CRM Integration',
      'React', 'TypeScript', 'Next.js 15', 'WebSockets', 'Tailwind CSS'
    ],
    features: ['Intelligent conversation flow', 'Dynamic product knowledge', 'Lead qualification scoring', 'CRM synchronization', 'Real-time analytics', 'Multi-language support'],
    complexity: 3,
    status: 'active',
    route: '/demos/ai-sales-agent'
  },
  {
    id: 'interactive-agents',
    name: 'Multi-Agent AI System',
    description: 'Collaborative AI agents working together on complex multi-step tasks',
    category: 'agent',
    position: [0, 0, 3],
    color: '#95E1D3',
    icon: '🕰️',
    size: 1.2,
    techStack: [
      'OpenAI Assistants API', 'Multi-Agent Architecture', 'WebSockets', 'State Management',
      'LangChain Agents', 'Tool Calling', 'Task Orchestration', 'Vector Databases',
      'React', 'TypeScript', 'Next.js 15', 'Supabase', 'Real-time Sync'
    ],
    features: ['Agent collaboration framework', 'Dynamic task delegation', 'Shared knowledge base', 'Goal-oriented planning', 'Real-time coordination', 'Performance monitoring'],
    complexity: 5,
    status: 'beta',
    route: '/demos/interactive-agents'
  },
  {
    id: 'youtube-summarizer',
    name: 'YouTube Summarizer',
    description: 'Quick summaries, bullet-point insights from YouTube links',
    category: 'tools',
    position: [-3, -1, -2],
    color: '#FF0000',
    icon: '📺',
    size: 0.8,
    techStack: ['YouTube API', 'OpenAI', 'Transcription', 'NLP'],
    features: ['Video transcription', 'Key points extraction', 'Timeline markers', 'Multi-language'],
    complexity: 2,
    status: 'active',
    route: '/demos/youtube-summarizer'
  },
  {
    id: 'data-analyst',
    name: 'AI Data Analyst Assistant',
    description: 'Analyze complex datasets with interactive charts and automated insights',
    category: 'analysis',
    position: [3, -1, -2],
    color: '#6C5CE7',
    icon: '📊',
    size: 1.1,
    techStack: ['OpenAI', 'Chart.js', 'D3.js', 'Papa Parse', 'Excel.js'],
    features: ['Data visualization', 'Statistical analysis', 'Pattern recognition', 'Export reports'],
    complexity: 4,
    status: 'active',
    route: '/demos/data-analyst-assistant'
  },
  {
    id: 'enhanced-rag',
    name: 'Enhanced RAG (LangChain)',
    description: 'Advanced retrieval-augmented generation using LangChain',
    category: 'ai',
    position: [0, -3, 0],
    color: '#00B894',
    icon: '🔗',
    size: 1.0,
    techStack: ['LangChain', 'Supabase Vector', 'OpenAI', 'Embeddings'],
    features: ['Document processing', 'Semantic search', 'Context retrieval', 'Multi-source'],
    complexity: 4,
    status: 'active',
    route: '/demos/enhanced-rag-langchain'
  }
];

export const connections: Connection[] = [
  // Financial Assistant connections
  {
    id: 'fin-data',
    source: 'financial-assistant',
    target: 'data-analyst',
    type: 'data',
    strength: 0.9,
    bidirectional: true,
    description: 'Shared data analysis and visualization capabilities'
  },
  {
    id: 'fin-rag',
    source: 'financial-assistant',
    target: 'enhanced-rag',
    type: 'model',
    strength: 0.8,
    bidirectional: false,
    description: 'RAG for financial document retrieval'
  },
  // Computer Vision connections
  {
    id: 'cv-gen',
    source: 'computer-vision',
    target: 'generative-ai',
    type: 'model',
    strength: 0.7,
    bidirectional: true,
    description: 'Image generation and processing pipeline'
  },
  // Agent connections
  {
    id: 'sales-interactive',
    source: 'sales-agent',
    target: 'interactive-agents',
    type: 'concept',
    strength: 0.8,
    bidirectional: true,
    description: 'Agent collaboration and communication patterns'
  },
  {
    id: 'chess-agents',
    source: 'chess-ai',
    target: 'interactive-agents',
    type: 'concept',
    strength: 0.6,
    bidirectional: false,
    description: 'Strategic planning and decision making'
  },
  // Content processing connections
  {
    id: 'youtube-rag',
    source: 'youtube-summarizer',
    target: 'enhanced-rag',
    type: 'data',
    strength: 0.7,
    bidirectional: false,
    description: 'Content extraction and retrieval'
  },
  // Cross-domain connections
  {
    id: 'cv-data',
    source: 'computer-vision',
    target: 'data-analyst',
    type: 'data',
    strength: 0.5,
    bidirectional: false,
    description: 'Visual data analysis'
  },
  {
    id: 'gen-rag',
    source: 'generative-ai',
    target: 'enhanced-rag',
    type: 'model',
    strength: 0.6,
    bidirectional: true,
    description: 'Content generation with context'
  },
  // Central hub connections
  {
    id: 'all-interactive',
    source: 'interactive-agents',
    target: 'financial-assistant',
    type: 'api',
    strength: 0.4,
    bidirectional: false,
    description: 'Agent-based financial analysis'
  }
];

export const techCategories = {
  'OpenAI': '#00A67E',
  'Hugging Face': '#FFD21E',
  'Supabase': '#3ECF8E',
  'Three.js': '#049EF4',
  'LangChain': '#00A67E',
  'Chart.js': '#FF6384'
};

export const connectionColors = {
  data: '#00D9FF',
  api: '#FFD700',
  model: '#FF00FF',
  concept: '#00FF00'
};