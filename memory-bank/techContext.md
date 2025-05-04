# Technical Context

## 3D Rendering Integration

### React Three Fiber & Three.js Usage

React Three Fiber is integrated throughout the application for 3D visualizations, but requires specific implementation patterns to avoid Server-Side Rendering (SSR) issues in Next.js:

1. **Dynamic Import Pattern**:
   ```typescript
   // Dynamically import R3F components with SSR disabled
   const Canvas3D = dynamic(() => import('@react-three/fiber').then(mod => mod.Canvas), { 
     ssr: false,
     loading: () => <div className="h-screen flex items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
     </div>
   });
   
   const ThreeDScene = dynamic(() => import('./components/ThreeDScene'), { 
     ssr: false 
   });
   ```

2. **Client Component Isolation**:
   - All components that use React Three Fiber are marked with `"use client"` directive
   - 3D rendering logic is isolated in separate files
   - Page components dynamically import 3D components to avoid SSR issues
   - Loading indicators are shown while 3D components are being loaded

3. **Next.js Configuration Adjustments**:
   ```javascript
   // next.config.mjs
   const nextConfig = {
     // ...existing config
     experimental: {
       webpackBuildWorker: true,
       optimizePackageImports: ['lucide-react']
     }
   };
   ```

4. **Known SSR Issues Fixed**:
   - "Cannot read properties of undefined (reading 'ReactCurrentOwner')" errors
   - Maximum update depth exceeded errors in Chess components
   - Build failures with React Three Fiber components
   - Duplicate key errors in component lists

### Three.js Library Usage

The application uses Three.js for various 3D visualizations:

1. **Chess 3D Visualization**:
   - Chess board and pieces rendered in 3D
   - Lighting and shadows for realistic appearance
   - Camera controls for viewing the board from different angles
   - Materials and textures for chess pieces and board

2. **Financial Assistant Background**:
   - 3D particle systems for data visualization
   - Animated grid background for depth
   - Dynamic lighting based on theme (light/dark)
   - Interactive camera movements

3. **Common Patterns**:
   - Scene setup with proper lighting
   - Material configuration for optimal appearance
   - Performance considerations for mobile devices
   - State synchronization between 2D UI and 3D visuals

## Technology Stack
1. Frontend:
   - Next.js 14.2.16
   - React 18.2.0
   - TypeScript 5.4.2
   - Tailwind CSS 3.4.17
   - Radix UI Components
   - Three.js 0.161.0
   - React Three Fiber 8.15.16
   - @react-three/drei 9.97.3
   - @react-three/postprocessing 2.15.12
   - Framer Motion 11.0.14

2. Backend:
   - Next.js API Routes
   - Supabase
   - SendGrid Mail 8.1.4
   - Node.js
   - Firecrawl API (for Financial Assistant chat)
   - Alpaca API (for Market Data ticker)
   - Upstash Ratelimit (@upstash/ratelimit)
   - Vercel KV (@vercel/kv)

3. Development:
   - ESLint
   - TypeScript
   - PostCSS
   - Sharp for image processing

4. Deployment:
   - Vercel
   - Vercel Analytics

5. Offline RL Training (chess-rl-training-local):
   - Python 3.9+
   - Conda (for environment management - `chess_rl` environment used)
   - PyTorch (`2.5.1+cu121` confirmed in `chess_rl` env)
   - ONNX (`1.15.0` for model export)
   - ONNX Runtime (`1.16.0` - with CUDA support for efficient inference)
   - python-chess
   - numpy
   - matplotlib
   - PyYAML
   - tqdm
   - multiprocessing (for parallel self-play)
   - queue (for batched evaluation)

5. Lc0 Fine-Tuning:
   - Python 3.9+
   - Conda (for environment management - `chess_rl` environment)
   - PyTorch (with CUDA support)
   - YAML (for configuration)
   - tqdm (for progress tracking)
   - requests (for network/data downloads)
   - gzip/tarfile (for file extraction)
   - Cutechess-cli (for model evaluation)
   - Stockfish (for benchmarking)
   - ONNX Runtime (planned for inference)

## Development Setup
1. Environment Requirements:
   - Node.js
   - npm/yarn
   - TypeScript
   - Environment variables (.env.local)
   - Conda (for Python RL environment)

2. Key Dependencies:
   ```json
   {
     "next": "14.2.16",
     "react": "18.2.0",
     "typescript": "5.4.2",
     "tailwindcss": "3.4.17",
     "@sendgrid/mail": "8.1.4",
     "@supabase/supabase-js": "2.49.1",
     "three": "0.161.0"
   }
   ```

3. Scripts:
   - `npm run dev`: Development server
   - `npm run build`: Production build
   - `npm run start`: Production server
   - Various image processing scripts
   - Python Scripts (in chess-rl-training-local):
     - `python main.py`: Main training loop
     - `python run_iterations.py`: Automated iteration script
     - `python optimized_self_play.py`: Run self-play with batched evaluation for better GPU utilization
     - `utils/export_to_onnx.py`: Export models to ONNX format
   - Python Scripts (Lc0 Fine-Tuning):
     - `python download_data.py --download-network --download-data --start-date YYYY-MM-DD`: Download network and training data
     - `python lc0_run/get_lc0.py`: Simple script to download just the network
     - `python train.py`: Execute training with frozen layers
     - `python benchmark.py`: Benchmark against Stockfish

## Project Structure
1. Chess RL Training Local (Directory Structure):
   ```
   chess-rl-training-local/
   ├── batch/                  # All Windows batch files
   ├── configs/                # Configuration files 
   ├── games/                  # Self-play game data
   ├── lichess_db_converted/   # Converted Lichess data
   ├── models/                 # Active models (only latest: initial_supervised.onnx)
   ├── models_archive/         # Archived/older models
   ├── runs/                   # Active runs (latest RL run and important Lichess run)
   │   ├── lichess_training_20250423_192008/
   │   └── rl_run_20250423_234035/
   ├── runs_archive/           # Archived/older runs
   ├── scripts/                # Helper scripts
   ├── src/                    # Core source code
   │   ├── __pycache__/
   │   ├── __init__.py
   │   ├── batched_evaluator.py
   │   ├── batched_mcts.py
   │   ├── board_representation.py
   │   ├── mcts.py
   │   ├── neural_network.py
   │   ├── self_play.py
   │   ├── train.py
   │   └── utils.py
   ├── utils/                  # Utility scripts
   │   ├── convert_lichess_games.py
   │   ├── convert_to_fp16.py
   │   ├── export_to_onnx.py
   │   ├── train_lichess.py
   │   └── verify_onnx.py
   ├── main.py                 # Main training loop
   ├── optimized_self_play.py  # Optimized self-play script
   ├── README.md               # Project documentation
   ├── requirements.txt        # Dependencies
   ├── run_iterations.py       # Automated iteration script
   └── run_optimized_rl_loop.py # Optimized RL loop script
   ```

2. Portfolio Frontend (Directory Structure):
   - Follows Next.js App Router conventions
   - Demo components in app/components/demos
   - Chess AI component in app/components/demos/ChessAiMagnus.tsx
   - API routes in app/api/[feature]/route.ts

1. Lc0 Fine-Tuning (Directory Structure):
   ```
   /
   ├── trainer/                # Training modules and configs
   │   ├── configs/            # Configuration files
   │   │   └── freeze_head.yaml # Layer freezing configuration
   │   ├── lc0_model.py        # Lc0 neural network implementation
   │   └── chunk_dataset.py    # Dataset for training chunks
   ├── networks/               # Downloaded neural networks
   │   └── baseline.pb         # Base network for fine-tuning
   ├── chunks/                 # Extracted training data chunks
   ├── training_data/          # Raw downloaded training data
   ├── output/                 # Fine-tuned model output
   │   └── fine_tuned_lc0.pth  # Fine-tuned model checkpoint
   ├── lc0_run/                # Utility scripts
   │   └── get_lc0.py          # Simple network download script
   ├── download_data.py        # Main data download script
   ├── train.py                # Training script
   └── benchmark.py            # Evaluation script
   ```

## Technical Constraints
1. Performance:
   - First Contentful Paint < 1.5s
   - Time to Interactive < 3.5s
   - Optimized image loading
   - Code splitting

2. Browser Support:
   - Modern browsers
   - Progressive enhancement
   - Responsive design

3. Security:
   - Environment variables
   - API route protection
   - Form validation
   - Admin authentication
   - API Rate Limiting (IP-based, 3 req/min for Firecrawl API, TBD for others)

## Dependencies
1. Core Dependencies:
   - Next.js ecosystem
   - React ecosystem
   - TypeScript
   - Tailwind CSS

2. UI Components:
   - Radix UI
   - Framer Motion
   - Three.js
   - React Three Fiber (for 3D chess implementation)
   - @react-three/drei (for 3D chess helper components)

3. Backend Services:
   - Supabase
   - SendGrid
   - Vercel
   - Alpaca
   - Firecrawl
   - Upstash/Vercel KV (for Rate Limiting)

4. Development Tools:
   - ESLint
   - PostCSS
   - Sharp
   - TypeScript compiler
   - Conda (for Python environment)

## Training Execution Notes (chess-rl-training-local)
- **Activation:** The `chess_rl` conda environment MUST be activated before running scripts.
- **Command (Main Loop):** Intended execution via `python main.py` (from within `chess-rl-training-local`) handles the iterative loop.
- **Command (Manual Training - Iteration 1):** `python -m src.train --config configs/config.yaml --data runs/run_20250422_162604/self_play/iteration_1 --output runs/run_20250422_162604/models/iteration_1`. (Ran without `--resume` to use initial weights).
- **Command (Manual Training - Iteration 2):** `python -m src.train --config configs/config.yaml --data runs/run_20250422_162604/self_play --output runs/run_20250422_162604/models/iteration_2 --resume runs/run_20250422_162604/models/iteration_1/checkpoint_best.pth`. (Uses data from Iterations 1+2, resumes from Iteration 1 best checkpoint).
- **Command (Manual Self-Play - Iteration 2):** `python -m src.self_play --model runs/run_20250422_162604/models/iteration_1/checkpoint_best.pth --output runs/run_20250422_162604/self_play/iteration_2 --config configs/config.yaml --games 100 --workers 4 --verbose`. (Loads best model from Iteration 1 training).
- **Command (Model Export to ONNX):** `python utils/export_to_onnx.py --checkpoint runs/run_path/checkpoint_latest.pth --output models/model_name.onnx --verify`. (Exports PyTorch model to ONNX format with verification).
- **Command (Optimized Self-Play):** `python optimized_self_play.py --model models/model_name.onnx --output games/output_dir --games 100 --batch-size 64 --workers 8`. (Runs self-play with batched evaluation for better GPU utilization).
- **Execution Context:** Manual commands (`python -m ...`) MUST be run from within the `chess-rl-training-local` directory to ensure modules and relative paths (like `runs/...`) are found correctly.
- **Known Execution Errors & Fixes:**
    - `AttributeError: module 'torch' has no attribute 'optim'`: Caused by running with incorrect Python environment (not `chess_rl`). Fix: Activate `chess_rl`.
    - `ImportError: attempted relative import with no known parent package`: Caused by running `python src/train.py` directly. Fix: Use `python -m src.train`.
    - `ModuleNotFoundError: No module named 'src'`: Caused by running `python -m src.train` from the wrong directory (must be run from `chess-rl-training-local`).
    - `KeyError: 'optimizer'`: Caused by using `--resume` with `initial_model.pth` (which lacks optimizer state). Fix: Omit `--resume` when starting training from initial model weights.
    - `ImportError: cannot import name 'init_logging'`: Caused by function rename (was `setup_logging`). Fix: Add a backward-compatible function in `src/utils.py`.
    - `AttributeError: 'int' object has no attribute 'upper'`: Caused by log level being an integer. Fix: Update `setup_logging` to handle both string and integer levels.
    - `TypeError: export_to_onnx() got an unexpected keyword argument 'opset_version'`: Fix: Pass the parameter correctly to `export_to_onnx` method.
- **Hardware Usage:** Utilizes GPU (if CUDA available and detected by PyTorch) for model training and inference during MCTS. CPU usage is high during the self-play phase due to MCTS computations (often bottlenecking GPU), while GPU usage is high during the training phase. Optimized self-play with batched evaluation improves GPU utilization.

## Lc0 Fine-Tuning Execution Notes
- **Activation:** The `chess_rl` conda environment MUST be activated before running scripts.
- **Command (Network Download):** `python download_data.py --download-network` downloads the base network.
- **Command (Training Data Download):** `python download_data.py --download-data --start-date 2023-01-01 --max-hours 5` downloads training data.
- **Command (Training):** `python train.py` executes the fine-tuning process.
- **Command (Benchmarking):** `python benchmark.py` evaluates the fine-tuned model against Stockfish.
- **Key Configuration Parameters:**
  - **Network Format:** t1
  - **Channels:** 256
  - **Residual Blocks:** 10
  - **Frozen Layers:** First 8 residual blocks
  - **Batch Size:** 4096 (8192 with gradient accumulation)
  - **Learning Rate:** 0.001 with cosine schedule
  - **Optimizer:** AdamW with weight decay 0.0001
  - **Mixed Precision:** Enabled
  - **Epochs:** 3

- **Hardware Usage:** Utilizes GPU for model training, with automatic mixed precision to maximize throughput. CPU usage is primarily for data loading and preprocessing.

## Financial Assistant Technologies

### Vector Database (RAG System)

1. **Supabase with pgvector**
   - **Purpose**: Stores financial knowledge as vector embeddings for semantic search
   - **Configuration**: 
     - pgvector extension enabled in extensions schema (moved from public for security)
     - documents table with embedding column (extensions.VECTOR(1536))
     - Row Level Security (RLS) policies for secure access
     - match_documents function with SECURITY DEFINER and fixed search_path
   - **Security Implementation**:
     - Extensions isolated in dedicated extensions schema (not in public)
     - SECURITY DEFINER attribute on match_documents function
     - Fixed search_path (SET search_path = public, extensions) to prevent injection
     - Properly qualified type references (extensions.VECTOR instead of VECTOR)
   - **Migration Scripts**: 
     - `20240425000000_create_documents_table.sql`: Creates the documents table with vector columns
     - `schedule_updates.js`: Regularly updates knowledge with current information
     - `apply_with_connection.js`: Applies security fixes to the database schema

2. **OpenAI Embeddings**
   - **Purpose**: Converts text content to vector embeddings for semantic search
   - **Implementation**: 
     - OpenAIEmbeddings from @langchain/openai
     - 1536-dimensional embeddings (ada-002 model)
     - Used in both data ingestion and query processing

3. **Real-time Information API**
   - **Endpoint**: `/api/financial-assistant/realtime`
   - **Purpose**: Fetches up-to-date financial information when needed
   - **Implementation**:
     - Next.js API route using NextResponse
     - Attempts to use Firecrawl API for web search
     - Has fallback mechanisms when external services unavailable
     - Pattern detection for determining when real-time info needed (/current|latest|new|today|recent|update|news|now|happening|trend/i)

4. **Scheduled Knowledge Updates**
   - **Script**: `schedule_updates.js`
   - **Trigger**: Can be run manually or scheduled via task scheduler/cron
   - **Process**:
     - Deletes outdated items (>7 days old)
     - Generates date-stamped financial information for six key categories
     - Creates embeddings for new content
     - Inserts records into Supabase documents table

5. **Response Generation**
   - **Implementation**: 
     - OpenAI chat completions API
     - System prompt engineered to prioritize real-time information
     - Contextual awareness of RAG results and user preferences
     - Format standardization for consistent responses

### Financial Assistant Libraries & Dependencies

- **@supabase/supabase-js**: Client library for Supabase interaction
- **@langchain/openai**: For creating embeddings and structured prompts
- **openai**: For generating AI responses
- **yahoo-finance2**: For fetching stock and market data
- **axios**: For HTTP requests in scheduled updates
- **dotenv**: For environment variable management
- **pg**: For direct PostgreSQL connections in migration scripts

### Financial Data Structures

1. **Document Schema**:
   ```typescript
   interface Document {
     id: string;                 // UUID
     content: string;            // Text content
     metadata: {                 // JSON metadata
       title: string;            // Document title
       source: string;           // Source of information
       category: string;         // Topic category
       type?: string;            // Optional type (e.g., 'update')
       created_at: string;       // ISO timestamp
     };
     embedding: number[];        // 1536-dimensional vector
     created_at: string;         // Creation timestamp
   }
   ```

2. **Market Data Schema**:
   ```typescript
   interface MarketData {
     symbol: string;             // Stock symbol (e.g., 'AAPL')
     name: string;               // Company name
     price: number;              // Current price
     change: number;             // Price change
     changePercent: number;      // Percentage change
     exchange: string;           // Exchange name
     currency: string;           // Currency code
   }
   ```

3. **User Preferences Schema**:
   ```typescript
   interface UserPreferences {
     investmentStyle?: string;   // Conservative, Moderate, Aggressive
     portfolioFocus?: string[];  // Growth, Income, Value, etc.
     riskTolerance?: string;     // Low, Medium, High
     timeHorizon?: string;       // Short, Medium, Long
     favoriteSymbols?: string[]; // List of favorite stock symbols
   }
   ```

### Database Security Implementation

1. **Schema Structure**:
   ```
   postgres (database)
   ├── public (schema)
   │   ├── documents (table)
   │   │   ├── id
   │   │   ├── content
   │   │   ├── metadata
   │   │   ├── embedding: extensions.VECTOR(1536)
   │   │   └── created_at
   │   └── match_documents (function - SECURITY DEFINER)
   └── extensions (schema)
       └── vector (extension)
   ```

2. **Security Features**:
   - **Dedicated Extensions Schema**: Isolates extensions from public schema
   - **Qualified Type References**: Uses `extensions.VECTOR` instead of `VECTOR`
   - **Function Security**: 
     ```sql
     CREATE OR REPLACE FUNCTION match_documents(
       query_embedding extensions.VECTOR(1536),
       match_threshold FLOAT,
       match_count INT
     )
     RETURNS TABLE (
       id UUID,
       content TEXT,
       metadata JSONB,
       similarity FLOAT
     )
     LANGUAGE plpgsql
     SECURITY DEFINER
     SET search_path = public, extensions
     AS $$
     BEGIN
       -- Function body
     END;
     $$;
     ```
   - **Database Search Path**: `ALTER DATABASE postgres SET search_path TO "$user", public, extensions;`
   - **Index Definition**: `CREATE INDEX documents_embedding_idx ON documents USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists = 100);`

3. **Migration Scripts**:
   - Node.js scripts using `pg` client for direct PostgreSQL connection
   - Connection parameters stored in environment variables
   - Scripts handle PostgreSQL errors and dependencies gracefully 

## Supabase Storage and Database for Chess AI

### Storage
- Model storage in Supabase bucket `chess-models`
- ONNX format for cross-platform compatibility
- Public URL for efficient model loading
- Direct access via URL for client-side efficiency

### Database Structure
- **chess_models table**:
  - Stores model metadata (name, version, ELO rating)
  - Tracks storage path and URL
  - Configuration data stored as JSONB
  - Versioning support for multiple models

- **chess_openings table**:
  - Stores common chess openings with ECO codes
  - Includes FEN positions and next move options
  - Position evaluation scores for each opening
  - Supports book move lookups for AI

- **chess_games table**:
  - Records game history (moves, results)
  - Links to player identifiers
  - Tracks AI model and difficulty level used
  - Supports PGN format for game export/analysis

### Row Level Security Policies
- Public read access for models and openings
- Restricted write access based on authentication
- Game history tied to player identifiers
- Secure data access patterns

### Integration Approach
- Next.js API routes for move generation
- Serverless function for game state management
- Client-side board rendering with React
- Direct Supabase storage access for model loading
- Database queries for opening book and game history 