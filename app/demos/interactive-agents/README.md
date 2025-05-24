# Interactive Agents Demo

This demo uses a Vercel Edge Function to generate agent responses for a user-provided goal. It showcases OpenAI agent collaboration by calling the OpenAI API and streaming the results to the UI. The interface now includes a gallery of specialized agents and a multi-agent collaboration mode.

## Usage
1. Navigate to `/demos/interactive-agents` in the portfolio.
2. Choose one or more agents from the gallery (enable **Multi-agent mode** for multiple selections).
3. Enter a goal and start the simulation to see the selected agents collaborate.

## File Structure
- `page.tsx`: Next.js page entry that loads the client component.
- `InteractiveAgentsDemo.tsx`: Implements the interactive simulation.
- `README.md`: This documentation file.
