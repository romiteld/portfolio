# Data Analyst Assistant Demo

This demo showcases an interactive Data Analyst Assistant built with React, Next.js, and Recharts. It allows users to upload CSV, Excel, or JSON data files, explore and visualize their data, and receive automated insights and statistics.

## Features
- Upload CSV, Excel (.xlsx, .xls), or JSON files
- Data preview and column selection
- Automated data analysis and insights
- Multiple chart types: Table, Bar, Line, Pie, Scatter, Correlation Matrix
- Chart configuration (aggregation, filtering, color by column)
- Copy data to clipboard
- Responsive design with dark/light mode support
- Uses Tailwind CSS for styling

## Usage
1. Navigate to `/demos/data-analyst-assistant` in the portfolio app.
2. Upload your data file (CSV, Excel, or JSON).
3. Explore, visualize, and analyze your data using the provided tools.

## Technical Details
- Built with React and Next.js App Router
- Uses `recharts` for data visualization
- Uses `papaparse` for CSV parsing and `xlsx` for Excel file support
- Icons from `lucide-react`
- Follows project demo and component structure conventions

## File Structure
- `page.tsx`: Next.js page entry point
- `components/DataAnalystAssistant.tsx`: Main component implementation
- `README.md`: This documentation file

## Testing
A basic test file can be added to ensure the component renders and handles file uploads correctly.

---

© 2024 Daniel Romitelli. All rights reserved.
