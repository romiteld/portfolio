# Chess AI Reinforcement Learning Demo

This repository contains a demonstration of reinforcement learning for chess, designed to showcase AI and machine learning capabilities for a portfolio.

## Overview

This project demonstrates a chess AI model trained using reinforcement learning techniques. The model uses a neural network architecture to predict move probabilities (policy) and position evaluations (value), similar to AlphaZero's approach.

## Components

- **Neural Network Model**: A ResNet architecture with residual blocks for chess position evaluation
- **Reinforcement Learning**: Self-play, policy and value learning
- **Model Training**: Fine-tuning capabilities with custom datasets
- **Inference**: ONNX acceleration for fast position evaluation
- **Benchmark Tools**: Performance evaluation and ELO rating estimation
- **Web UI**: Interactive interface to play against the trained model

## Demo Application

The primary portfolio demo is in `chess_portfolio_demo.py`, which:

1. Downloads or loads a pre-trained model
2. Fine-tunes it with a custom dataset
3. Visualizes the training metrics
4. Provides a web UI for visitors to play against the model

To run the demo:

```bash
# Run the full demo (download, fine-tune, web UI)
./run_portfolio_demo.bat

# Or run specific components
python chess_portfolio_demo.py --fine-tune
python chess_portfolio_demo.py --web-ui
```

## Benchmarking

The benchmark tools measure both:

1. **Performance** (positions evaluated per second)
2. **Playing strength** (estimated ELO rating)

To benchmark a model:

```bash
cd benchmark
./benchmark.bat  # For performance benchmark
./elo_benchmark.bat "path/to/stockfish.exe"  # For ELO rating estimation
```

## Model Architecture

The neural network model uses a ResNet architecture:
- Input: 119-channel board representation
- Residual blocks with skip connections
- Dual output heads:
  - Policy head: Predicts move probabilities
  - Value head: Evaluates positions

## Technical Details

- Written in Python with PyTorch for the neural network
- ONNX for optimized inference
- Gradio for the web UI
- Implements board representation similar to AlphaZero
- Supports both CPU and GPU training/inference

## Requirements

- Python 3.8+
- PyTorch
- ONNX Runtime
- Python Chess
- Gradio (for web UI)
- Matplotlib (for visualization)
- Stockfish (for ELO estimation benchmarks)

## License

MIT License 