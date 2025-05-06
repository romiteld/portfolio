'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, FilePlus, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Table2, Sigma, Brain, Save, Share2, Clipboard, Eye, EyeOff, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Define TypeScript interfaces
interface DataItem {
  [key: string]: string | number | null | undefined;
}

interface ChartConfigType {
  title: string;
  xAxis: string;
  yAxis: string;
  color: string;
  aggregation: 'none' | 'sum' | 'avg' | 'min' | 'max' | 'count';
  filter: string;
}

interface StatType {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
}

interface StatisticsType {
  [key: string]: StatType;
}

interface CorrelationRow {
  column: string;
  [key: string]: string | number;
}

interface MissingValueData {
  column: string;
  missingCount: number;
  percentage: number;
}

interface CategoryData {
  name: string;
  count: number;
}

interface TimeSeriesData {
  date: string;
  value: number;
}

interface CorrelationData {
  column1: string;
  column2: string;
  correlation: number;
}

interface InsightType {
  type: string;
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  visualization: string;
  column?: string;
  numericColumn?: string;
  data?: StatisticsType | MissingValueData[] | CategoryData[] | TimeSeriesData[] | CorrelationData[] | any;
}

// ClientOnly wrapper component to prevent SSR issues
const ClientOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null;
  }
  
  return <>{children}</>;
};

// Main Data Analyst Assistant component
const DataAnalystAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [data, setData] = useState<DataItem[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [insights, setInsights] = useState<InsightType[]>([]);
  const [selectedChart, setSelectedChart] = useState<string>('table');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [dataPreview, setDataPreview] = useState<DataItem[]>([]);
  const [chartConfiguration, setChartConfiguration] = useState<ChartConfigType>({
    title: '',
    xAxis: '',
    yAxis: '',
    color: '',
    aggregation: 'none',
    filter: ''
  });
  const [statistics, setStatistics] = useState<StatisticsType>({});
  const [showConfiguration, setShowConfiguration] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFullData, setShowFullData] = useState<boolean>(false);
  const [selectedInsight, setSelectedInsight] = useState<InsightType | null>(null);
  const [correlationMatrix, setCorrelationMatrix] = useState<CorrelationRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // COLORS for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1', '#A4DE6C', '#D0ED57'];
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      const fileContent = await readFileContent(file, fileExtension || '');
      if (fileContent) {
        setData(fileContent);
        const cols = Object.keys(fileContent[0] || {});
        setColumns(cols);
        setSelectedColumns(cols.slice(0, Math.min(2, cols.length)));
        setDataPreview(fileContent.slice(0, 5));
        setChartConfiguration({
          ...chartConfiguration,
          xAxis: cols[0] || '',
          yAxis: cols[1] || '',
          color: cols[2] || ''
        });
        
        // Reset other states
        setInsights([]);
        setStatistics({});
        setCorrelationMatrix([]);
        setSelectedInsight(null);
        
        // If we have data, automatically analyze it
        if (fileContent.length > 0) {
          setTimeout(() => {
            analyzeData(fileContent, cols);
          }, 100);
        }
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setErrorMessage(`Error processing file: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Read file content based on its type
  const readFileContent = (file: File, extension: string): Promise<DataItem[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result;
          if (!content) {
            reject(new Error("Failed to read file content"));
            return;
          }
          
          switch (extension) {
            case 'csv':
              // Parse CSV with Papa Parse
              import('papaparse').then(({ default: Papa }) => {
                const result = Papa.parse(content as string, { 
                  header: true, 
                  dynamicTyping: true, 
                  skipEmptyLines: true 
                });
                if (result.errors && result.errors.length > 0) {
                  console.warn('CSV parsing warnings:', result.errors);
                }
                resolve(result.data as DataItem[]);
              });
              break;
              
            case 'json':
              // Parse JSON
              resolve(JSON.parse(content as string) as DataItem[]);
              break;
              
            case 'xlsx':
            case 'xls':
              // For Excel files, use SheetJS
              import('xlsx').then(({ default: XLSX }) => {
                const workbook = XLSX.read(content, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                resolve(jsonData as DataItem[]);
              });
              break;
              
            default:
              reject(new Error(`Unsupported file format: .${extension}`));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      
      if (extension === 'xlsx' || extension === 'xls') {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsText(file);
      }
    });
  };
  
  // Analyze the data to generate insights
  const analyzeData = async (dataToAnalyze: DataItem[], dataColumns: string[]) => {
    setIsAnalyzing(true);
    
    try {
      // Calculate basic statistics for numeric columns
      const stats: StatisticsType = {};
      const numericalColumns: string[] = [];
      
      // Identify numerical columns and calculate statistics
      dataColumns.forEach(column => {
        if (dataToAnalyze.length > 0 && typeof dataToAnalyze[0][column] === 'number') {
          numericalColumns.push(column);
          
          const values = dataToAnalyze
            .map(row => row[column] as number)
            .filter(val => val !== null && val !== undefined && !isNaN(val));
          
          if (values.length > 0) {
            const sum = values.reduce((a, b) => a + b, 0);
            const mean = sum / values.length;
            const sortedValues = [...values].sort((a, b) => a - b);
            const median = sortedValues.length % 2 === 0
              ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
              : sortedValues[Math.floor(sortedValues.length / 2)];
            const min = Math.min(...values);
            const max = Math.max(...values);
            const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);
            
            stats[column] = {
              count: values.length,
              mean: mean,
              median: median,
              min: min,
              max: max,
              stdDev: stdDev,
            };
          }
        }
      });
      
      setStatistics(stats);
      
      // Calculate correlation matrix for numerical columns
      if (numericalColumns.length >= 2) {
        const correlations: CorrelationRow[] = [];
        
        for (const col1 of numericalColumns) {
          const correlationRow: CorrelationRow = { column: col1 };
          
          for (const col2 of numericalColumns) {
            if (col1 === col2) {
              correlationRow[col2] = 1; // Correlation of a column with itself is 1
            } else {
              correlationRow[col2] = calculateCorrelation(
                dataToAnalyze.map(row => row[col1] as number),
                dataToAnalyze.map(row => row[col2] as number)
              );
            }
          }
          
          correlations.push(correlationRow);
        }
        
        setCorrelationMatrix(correlations);
      }
      
      // Generate insights
      const newInsights: InsightType[] = [];
      
      // Insight 1: Data overview
      newInsights.push({
        type: 'overview',
        title: 'Data Overview',
        description: `This dataset contains ${dataToAnalyze.length} records with ${dataColumns.length} columns.`,
        importance: 'high',
        visualization: 'table'
      });
      
      // Insight 2: Numerical columns stats
      if (Object.keys(stats).length > 0) {
        newInsights.push({
          type: 'statistics',
          title: 'Numerical Column Statistics',
          description: `Found ${Object.keys(stats).length} numerical columns with statistical analysis.`,
          importance: 'medium',
          visualization: 'table',
          data: stats
        });
      }
      
      // Insight 3: Missing values
      const missingValuesMap: Record<string, { count: number, percentage: number }> = {};
      let hasMissingValues = false;
      
      dataColumns.forEach(column => {
        const missingCount = dataToAnalyze.filter(row => 
          row[column] === null || row[column] === undefined || row[column] === ''
        ).length;
        
        if (missingCount > 0) {
          hasMissingValues = true;
          missingValuesMap[column] = {
            count: missingCount,
            percentage: (missingCount / dataToAnalyze.length) * 100
          };
        }
      });
      
      if (hasMissingValues) {
        newInsights.push({
          type: 'missing_values',
          title: 'Missing Values',
          description: 'Some columns have missing values that might affect analysis.',
          importance: 'high',
          visualization: 'bar',
          data: Object.keys(missingValuesMap).map(column => ({
            column,
            missingCount: missingValuesMap[column].count,
            percentage: missingValuesMap[column].percentage
          }))
        });
      }
      
      // Insight 4: Distribution of categorical columns
      dataColumns.forEach(column => {
        if (dataToAnalyze.length > 0 && typeof dataToAnalyze[0][column] === 'string') {
          const valueFrequency: Record<string, number> = {};
          dataToAnalyze.forEach(row => {
            const value = row[column] as string;
            if (value !== null && value !== undefined && value !== '') {
              valueFrequency[value] = (valueFrequency[value] || 0) + 1;
            }
          });
          
          const uniqueValues = Object.keys(valueFrequency);
          
          // Only analyze categorical columns with reasonable number of categories
          if (uniqueValues.length >= 2 && uniqueValues.length <= 15) {
            const topCategories = uniqueValues
              .map(value => ({ name: value, count: valueFrequency[value] }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10); // Get top 10 categories
              
            newInsights.push({
              type: 'category_distribution',
              title: `Distribution of "${column}"`,
              description: `This column has ${uniqueValues.length} unique values.`,
              importance: 'medium',
              visualization: 'pie',
              column: column,
              data: topCategories
            });
          }
        }
      });
      
      // Insight 5: Identify strong correlations
      if (correlationMatrix.length > 0) {
        const strongCorrelations: CorrelationData[] = [];
        
        for (let i = 0; i < numericalColumns.length; i++) {
          for (let j = i + 1; j < numericalColumns.length; j++) {
            const col1 = numericalColumns[i];
            const col2 = numericalColumns[j];
            const corrRow = correlationMatrix.find(item => item.column === col1);
            
            if (corrRow) {
              const corrValue = corrRow[col2] as number;
              
              if (Math.abs(corrValue) > 0.7) { // Strong correlation threshold
                strongCorrelations.push({
                  column1: col1,
                  column2: col2,
                  correlation: corrValue
                });
              }
            }
          }
        }
        
        if (strongCorrelations.length > 0) {
          newInsights.push({
            type: 'correlation',
            title: 'Strong Correlations',
            description: `Found ${strongCorrelations.length} strong correlations between numerical columns.`,
            importance: 'high',
            visualization: 'scatter',
            data: strongCorrelations
          });
        }
      }
      
      // Insight 6: Time trends (if date/time columns exist)
      dataColumns.forEach(column => {
        // Check if column might contain dates
        if (dataToAnalyze.length > 0) {
          const sampleValue = dataToAnalyze[0][column];
          let isDateColumn = false;
          
          if (typeof sampleValue === 'string') {
            // Try to parse as date
            const dateFormats = [
              /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
              /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
              /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
              /^\d{4}\/\d{2}\/\d{2}/ // YYYY/MM/DD
            ];
            isDateColumn = dateFormats.some(format => format.test(sampleValue));
            // Remove invalid instanceof usage (TS error)
            // Instead, check if sampleValue is a Date object by using Object.prototype.toString
            } else if (
              sampleValue &&
              Object.prototype.toString.call(sampleValue) === '[object Date]' &&
              !isNaN((sampleValue as unknown as Date).getTime())
            ) {
              isDateColumn = true;
            }
            if (isDateColumn && Object.keys(stats).length > 0) {
            // Find a numerical column to analyze over time
            const numericColumn = Object.keys(stats)[0]; // Take the first numeric column
            
            if (numericColumn) {
              // Prepare time series data (simplified for this implementation)
              const timeSeriesData = dataToAnalyze
                .filter(row => row[column] && row[numericColumn] !== null && row[numericColumn] !== undefined)
                .map(row => ({
                  date: row[column] as string,
                  value: row[numericColumn] as number
                }))
                .sort((a, b) => {
                  const dateA = new Date(a.date);
                  const dateB = new Date(b.date);
                  return dateA.getTime() - dateB.getTime();
                });
                
              if (timeSeriesData.length > 0) {
                newInsights.push({
                  type: 'time_series',
                  title: `${numericColumn} Over Time`,
                  description: `Trend analysis of ${numericColumn} across time periods.`,
                  importance: 'medium',
                  visualization: 'line',
                  column: column,
                  numericColumn: numericColumn,
                  data: timeSeriesData
                });
              }
            }
          }
        }
      });
      
      setInsights(newInsights);
      
    } catch (error) {
      console.error("Error analyzing data:", error);
      setErrorMessage(`Error during analysis: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Calculate Pearson correlation coefficient
  const calculateCorrelation = (xValues: (number | null | undefined)[], yValues: (number | null | undefined)[]): number => {
    // Filter out null/undefined/NaN values
    const filteredData = xValues.map((x, i) => [x, yValues[i]])
      .filter(([x, y]) => 
        x !== null && x !== undefined && !isNaN(x as number) &&
        y !== null && y !== undefined && !isNaN(y as number)
      ) as [number, number][];
    
    if (filteredData.length < 2) return 0;
    
    const xs = filteredData.map(d => d[0]);
    const ys = filteredData.map(d => d[1]);
    
    const xMean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
    
    const numerator = xs.map((x, i) => (x - xMean) * (ys[i] - yMean))
      .reduce((a, b) => a + b, 0);
    
    const xDenom = Math.sqrt(xs.map(x => Math.pow(x - xMean, 2))
      .reduce((a, b) => a + b, 0));
    const yDenom = Math.sqrt(ys.map(y => Math.pow(y - yMean, 2))
      .reduce((a, b) => a + b, 0));
    
    const denominator = xDenom * yDenom;
    
    return denominator === 0 ? 0 : numerator / denominator;
  };
  
  // Handle chart type selection
  const handleChartTypeSelect = (chartType: string) => {
    setSelectedChart(chartType);
  };
  
  // Handle column selection for charts
  const handleColumnSelect = (column: string) => {
    // Toggle column selection
    if (selectedColumns.includes(column)) {
      setSelectedColumns(selectedColumns.filter(col => col !== column));
    } else {
      setSelectedColumns([...selectedColumns, column]);
    }
  };
  
  // Handle chart configuration change
  const handleConfigChange = (key: keyof ChartConfigType, value: string) => {
    setChartConfiguration({
      ...chartConfiguration,
      [key]: value
    });
  };
  
  // Render the appropriate chart based on the selection
  const renderChart = () => {
    if (!data || data.length === 0) return null;
    
    if (selectedChart === 'table') {
      return renderDataTable();
    }
    
    // Prepare chart data based on selected columns
    let chartData = data;
    
    // Apply any filtering from configuration
    if (chartConfiguration.filter) {
      try {
        // Simple filter parsing - this could be much more sophisticated in a real app
        const [column, operator, value] = chartConfiguration.filter.split(' ');
        
        if (column && operator && value !== undefined) {
          chartData = chartData.filter(row => {
            const cellValue = row[column];
            const filterValue = !isNaN(Number(value)) ? Number(value) : value;
            
            switch (operator) {
              case '=': return cellValue == filterValue;
              case '>': return (cellValue as number) > (filterValue as number);
              case '<': return (cellValue as number) < (filterValue as number);
              case '>=': return (cellValue as number) >= (filterValue as number);
              case '<=': return (cellValue as number) <= (filterValue as number);
              case '!=': return cellValue != filterValue;
              default: return true;
            }
          });
        }
      } catch (error) {
        console.warn('Filter parsing error:', error);
      }
    }
    
    // Apply aggregation if needed
    if (chartConfiguration.aggregation !== 'none' && chartConfiguration.xAxis && chartConfiguration.yAxis) {
      const aggregatedData: Record<string, number[]> = {};
      
      chartData.forEach(row => {
        const key = row[chartConfiguration.xAxis];
        if (key !== undefined && key !== null) {
          const keyStr = String(key);
          if (!aggregatedData[keyStr]) {
            aggregatedData[keyStr] = [];
          }
          
          const value = row[chartConfiguration.yAxis];
          if (value !== undefined && value !== null && !isNaN(Number(value))) {
            aggregatedData[keyStr].push(Number(value));
          }
        }
      });
      
      chartData = Object.keys(aggregatedData).map(key => {
        const values = aggregatedData[key];
        let aggregatedValue = 0;
        
        switch (chartConfiguration.aggregation) {
          case 'sum':
            aggregatedValue = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            aggregatedValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            break;
          case 'min':
            aggregatedValue = values.length > 0 ? Math.min(...values) : 0;
            break;
          case 'max':
            aggregatedValue = values.length > 0 ? Math.max(...values) : 0;
            break;
          case 'count':
            aggregatedValue = values.length;
            break;
          default:
            aggregatedValue = values.length > 0 ? values[0] : 0;
        }
        
        return {
          [chartConfiguration.xAxis]: key,
          [chartConfiguration.yAxis]: aggregatedValue
        };
      });
    }
    
    // Limit data points for performance
    const maxDataPoints = 100;
    if (chartData.length > maxDataPoints) {
      chartData = chartData.slice(0, maxDataPoints);
    }
    
    switch (selectedChart) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chartConfiguration.xAxis} 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis dataKey={chartConfiguration.yAxis} />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey={chartConfiguration.yAxis} 
                fill="#8884d8" 
                name={chartConfiguration.yAxis}
              />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chartConfiguration.xAxis}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={chartConfiguration.yAxis} 
                stroke="#8884d8" 
                name={chartConfiguration.yAxis}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        // For pie charts, we need categorical data
        // Here we'll group the data by the xAxis and count/sum by the yAxis
        const pieData: Array<{name: string, value: number}> = [];
        const groupedData: Record<string, number> = {};
        
        chartData.forEach(item => {
          const key = item[chartConfiguration.xAxis];
          if (key !== undefined && key !== null) {
            const keyStr = String(key);
            if (!groupedData[keyStr]) {
              groupedData[keyStr] = 0;
            }
            
            // For numeric values, sum them up; for non-numeric, just count
            const value = item[chartConfiguration.yAxis];
            if (value !== undefined && value !== null && !isNaN(Number(value))) {
              groupedData[keyStr] += Number(value);
            } else {
              groupedData[keyStr] += 1;
            }
          }
        });
        
        Object.keys(groupedData).forEach(key => {
          pieData.push({
            name: key,
            value: groupedData[key]
          });
        });
        
        // Limit to top 10 categories for pie chart readability
        const sortedPieData = [...pieData].sort((a, b) => b.value - a.value).slice(0, 10);
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={sortedPieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent ? (percent * 100).toFixed(0) : 0)}%`}
              >
                {sortedPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => Math.round(Number(value) * 100) / 100} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'scatter':
        // For scatter plots, we need numerical x and y
        if (chartConfiguration.xAxis && chartConfiguration.yAxis) {
          // Filter data to ensure both axes have numerical values
          const scatterData = chartData.filter(item => 
            item[chartConfiguration.xAxis] !== undefined && 
            item[chartConfiguration.xAxis] !== null && 
            !isNaN(Number(item[chartConfiguration.xAxis])) &&
            item[chartConfiguration.yAxis] !== undefined && 
            item[chartConfiguration.yAxis] !== null && 
            !isNaN(Number(item[chartConfiguration.yAxis]))
          );
          
          return (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey={chartConfiguration.xAxis} 
                  name={chartConfiguration.xAxis} 
                  label={{ value: chartConfiguration.xAxis, position: 'bottom', offset: 0 }}
                />
                <YAxis 
                  type="number" 
                  dataKey={chartConfiguration.yAxis} 
                  name={chartConfiguration.yAxis} 
                  label={{ value: chartConfiguration.yAxis, angle: -90, position: 'left' }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value) => Math.round(Number(value) * 100) / 100} />
                <Legend />
                <Scatter
                  name={`${chartConfiguration.xAxis} vs ${chartConfiguration.yAxis}`}
                  data={scatterData}
                  fill="#8884d8"
                />
              </ScatterChart>
            </ResponsiveContainer>
          );
        }
        return null;
        
      case 'correlation':
        if (correlationMatrix.length > 0) {
          // Render correlation matrix as a heatmap-like table
          return (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border">Column</th>
                    {correlationMatrix[0] && Object.keys(correlationMatrix[0])
                      .filter(key => key !== 'column')
                      .map(col => (
                        <th key={col} className="px-4 py-2 border">{col}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {correlationMatrix.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 border font-medium">{row.column}</td>
                      {Object.keys(row)
                        .filter(key => key !== 'column')
                        .map(col => {
                          const value = row[col] as number;
                          // Color coding based on correlation strength
                          let bgColor = 'bg-white';
                          if (value > 0.7) bgColor = 'bg-green-100';
                          else if (value > 0.4) bgColor = 'bg-green-50';
                          else if (value < -0.7) bgColor = 'bg-red-100';
                          else if (value < -0.4) bgColor = 'bg-red-50';
                          
                          return (
                            <td 
                              key={col} 
                              className={`px-4 py-2 border text-center ${bgColor}`}
                            >
                              {value.toFixed(2)}
                            </td>
                          );
                        })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return null;
        
      default:
        return null;
    }
  };
  
  // Render the data table
  const renderDataTable = () => {
    if (!data || data.length === 0) return null;
    
    const dataToShow = showFullData ? data : dataPreview;
    const visibleColumns = selectedColumns.length > 0 ? selectedColumns : columns;
    
    return (
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg mb-4">
        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
            <tr>
              {visibleColumns.map((column, index) => (
                <th key={index} className="px-6 py-3">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataToShow.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}
              >
                {visibleColumns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    {row[column] !== null && row[column] !== undefined ? String(row[column]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!showFullData && data.length > dataPreview.length && (
          <div className="p-2 text-sm text-gray-600 dark:text-gray-400 text-center">
            Showing {dataPreview.length} of {data.length} rows.
            <button 
              className="ml-2 text-blue-600 dark:text-blue-400 underline"
              onClick={() => setShowFullData(true)}
            >
              Show all
            </button>
          </div>
        )}
        {showFullData && (
          <div className="p-2 text-sm text-gray-600 dark:text-gray-400 text-center">
            <button 
              className="text-blue-600 dark:text-blue-400 underline"
              onClick={() => setShowFullData(false)}
            >
              Show preview only
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Render insight visualizations
  const renderInsightVisualization = (insight: InsightType) => {
    if (!insight) return null;
    
    switch (insight.type) {
      case 'overview':
        return renderDataTable();
        
      case 'statistics':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border">Column</th>
                  <th className="px-4 py-2 border">Count</th>
                  <th className="px-4 py-2 border">Mean</th>
                  <th className="px-4 py-2 border">Median</th>
                  <th className="px-4 py-2 border">Min</th>
                  <th className="px-4 py-2 border">Max</th>
                  <th className="px-4 py-2 border">Std Dev</th>
                </tr>
              </thead>
              <tbody>
                {insight.data && Object.keys(insight.data as StatisticsType).map((column, index) => {
                  const stats = (insight.data as StatisticsType)[column];
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 border font-medium">{column}</td>
                      <td className="px-4 py-2 border text-center">{stats.count}</td>
                      <td className="px-4 py-2 border text-center">{stats.mean.toFixed(2)}</td>
                      <td className="px-4 py-2 border text-center">{stats.median.toFixed(2)}</td>
                      <td className="px-4 py-2 border text-center">{stats.min.toFixed(2)}</td>
                      <td className="px-4 py-2 border text-center">{stats.max.toFixed(2)}</td>
                      <td className="px-4 py-2 border text-center">{stats.stdDev.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        
      case 'missing_values':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={insight.data as MissingValueData[]} 
              margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="column" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip formatter={(value) => `${(Number(value)).toFixed(2)}%`} />
              <Legend />
              <Bar 
                dataKey="percentage" 
                fill="#FF8042" 
                name="Missing Values (%)" 
              />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'category_distribution':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={insight.data as CategoryData[]}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="count"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent ? (percent * 100).toFixed(0) : 0)}%`}
              >
                {(insight.data as CategoryData[]).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => Number(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'correlation':
        // Show a scatter plot for the first strong correlation
        if (insight.data && (insight.data as CorrelationData[]).length > 0) {
          const correlation = (insight.data as CorrelationData[])[0];
          
          const scatterData = data
            ?.filter(item => 
              item[correlation.column1] !== undefined && 
              item[correlation.column1] !== null && 
              !isNaN(Number(item[correlation.column1])) &&
              item[correlation.column2] !== undefined && 
              item[correlation.column2] !== null && 
              !isNaN(Number(item[correlation.column2]))
            )
            .map(item => ({
              x: Number(item[correlation.column1]),
              y: Number(item[correlation.column2])
            }));
          
          return (
            <div>
              <p className="text-center text-sm mb-2">
                Correlation: {correlation.correlation.toFixed(2)} 
                ({correlation.correlation > 0 ? 'Positive' : 'Negative'})
              </p>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name={correlation.column1} 
                    label={{ value: correlation.column1, position: 'bottom', offset: 0 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name={correlation.column2} 
                    label={{ value: correlation.column2, angle: -90, position: 'left' }}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value) => Math.round(Number(value) * 100) / 100} />
                  <Scatter name={`${correlation.column1} vs ${correlation.column2}`} data={scatterData} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          );
        }
        return null;
        
      case 'time_series':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart 
              data={insight.data as TimeSeriesData[]} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                name={insight.numericColumn}
                dot={{ r: 3 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-black dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Data Analyst Assistant</h1>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm flex items-center">
              <Save className="w-4 h-4 mr-1" />
              Save
            </button>
            <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm flex items-center">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow flex flex-col md:flex-row">
        {/* Left Sidebar - Tabs */}
        <div className="w-full md:w-20 bg-white dark:bg-gray-800 shadow-md p-2 flex flex-row md:flex-col">
          <button 
            className={`flex flex-col items-center justify-center p-3 rounded-md w-full mb-2 ${activeTab === 'upload' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload className="w-6 h-6 mb-1" />
            <span className="text-xs">Upload</span>
          </button>
          <button 
            className={`flex flex-col items-center justify-center p-3 rounded-md w-full mb-2 ${activeTab === 'explore' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('explore')}
            disabled={!data}
          >
            <Table2 className="w-6 h-6 mb-1" />
            <span className="text-xs">Explore</span>
          </button>
          <button 
            className={`flex flex-col items-center justify-center p-3 rounded-md w-full mb-2 ${activeTab === 'visualize' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('visualize')}
            disabled={!data}
          >
            <BarChart3 className="w-6 h-6 mb-1" />
            <span className="text-xs">Visualize</span>
          </button>
          <button 
            className={`flex flex-col items-center justify-center p-3 rounded-md w-full mb-2 ${activeTab === 'insights' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('insights')}
            disabled={!data}
          >
            <Brain className="w-6 h-6 mb-1" />
            <span className="text-xs">Insights</span>
          </button>
          <button 
            className={`flex flex-col items-center justify-center p-3 rounded-md w-full ${activeTab === 'statistics' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('statistics')}
            disabled={!data}
          >
            <Sigma className="w-6 h-6 mb-1" />
            <span className="text-xs">Stats</span>
          </button>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-grow p-4">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Your Data</h2>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.xlsx,.xls,.json"
                  className="hidden"
                  id="fileInput"
                />
                <label htmlFor="fileInput" className="cursor-pointer">
                  <FilePlus className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                  <p className="mb-2 text-lg font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">CSV, Excel, or JSON files</p>
                </label>
              </div>
              
              {fileName && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-medium">{fileName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {data ? `${data.length} rows, ${columns.length} columns` : 'Processing...'}
                    </p>
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700"
                    title="Remove uploaded file"
                    aria-label="Remove uploaded file"
                    onClick={() => {
                      setFileName('');
                      setData(null);
                      setColumns([]);
                      setDataPreview([]);
                      setInsights([]);
                      setStatistics({});
                      setSelectedInsight(null);
                    }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              {errorMessage && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-md text-red-600 dark:text-red-400">
                  {errorMessage}
                </div>
              )}
              
              {data && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Data Preview</h3>
                  {renderDataTable()}
                  
                  <div className="mt-4 flex justify-end">
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded-md"
                      onClick={() => setActiveTab('explore')}
                    >
                      Explore Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Explore Tab */}
          {activeTab === 'explore' && data && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Explore Your Data</h2>
              
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Dataset Overview</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <p><span className="font-medium">Rows:</span> {data.length}</p>
                    <p><span className="font-medium">Columns:</span> {columns.length}</p>
                    <p><span className="font-medium">File:</span> {fileName}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Column Selection</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md h-40 overflow-y-auto">
                    {columns.map((column, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={`column-${index}`}
                          checked={selectedColumns.includes(column)}
                          onChange={() => handleColumnSelect(column)}
                          className="mr-2"
                        />
                        <label htmlFor={`column-${index}`}>{column}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Data Table</h3>
                  <div className="flex items-center">
                    <button 
                      className="flex items-center text-sm text-gray-600 dark:text-gray-400 mr-4"
                      onClick={() => setShowFullData(!showFullData)}
                    >
                      {showFullData ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Show Preview
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Show All Data
                        </>
                      )}
                    </button>
                    
                    <button 
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm flex items-center"
                      onClick={() => {
                        // Copy selected data to clipboard
                        if (data) {
                          const textData = data
                            .map(row => 
                              selectedColumns
                                .map(col => row[col])
                                .join(',')
                            )
                            .join('\n');
                          
                          navigator.clipboard.writeText(textData);
                        }
                      }}
                    >
                      <Clipboard className="w-4 h-4 mr-1" />
                      Copy Selected
                    </button>
                  </div>
                </div>
                {renderDataTable()}
              </div>
              
            </div>
          )}
          
          {/* Visualize Tab */}
          {activeTab === 'visualize' && data && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Visualize Your Data</h2>
              
              <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-2">
                <button 
                  className={`p-2 rounded-md flex flex-col items-center ${selectedChart === 'table' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700'}`}
                  onClick={() => handleChartTypeSelect('table')}
                >
                  <Table2 className="w-6 h-6 mb-1" />
                  <span className="text-xs">Table</span>
                </button>
                <button 
                  className={`p-2 rounded-md flex flex-col items-center ${selectedChart === 'bar' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700'}`}
                  onClick={() => handleChartTypeSelect('bar')}
                >
                  <BarChart3 className="w-6 h-6 mb-1" />
                  <span className="text-xs">Bar</span>
                </button>
                <button 
                  className={`p-2 rounded-md flex flex-col items-center ${selectedChart === 'line' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700'}`}
                  onClick={() => handleChartTypeSelect('line')}
                >
                  <LineChartIcon className="w-6 h-6 mb-1" />
                  <span className="text-xs">Line</span>
                </button>
                <button 
                  className={`p-2 rounded-md flex flex-col items-center ${selectedChart === 'pie' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700'}`}
                  onClick={() => handleChartTypeSelect('pie')}
                >
                  <PieChartIcon className="w-6 h-6 mb-1" />
                  <span className="text-xs">Pie</span>
                </button>
                <button 
                  className={`p-2 rounded-md flex flex-col items-center ${selectedChart === 'scatter' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700'}`}
                  onClick={() => handleChartTypeSelect('scatter')}
                >
                  <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="8" cy="8" r="2" />
                    <circle cx="16" cy="16" r="2" />
                    <circle cx="12" cy="10" r="2" />
                    <circle cx="18" cy="8" r="2" />
                    <circle cx="6" cy="16" r="2" />
                  </svg>
                  <span className="text-xs">Scatter</span>
                </button>
                <button 
                  className={`p-2 rounded-md flex flex-col items-center ${selectedChart === 'correlation' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700'}`}
                  onClick={() => handleChartTypeSelect('correlation')}
                >
                  <Sigma className="w-6 h-6 mb-1" />
                  <span className="text-xs">Correlation</span>
                </button>
              </div>
              
              {/* Chart Configuration */}
              {selectedChart !== 'table' && selectedChart !== 'correlation' && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-medium">Chart Configuration</h3>
                    <button 
                      className="flex items-center text-sm text-gray-600 dark:text-gray-400"
                      onClick={() => setShowConfiguration(!showConfiguration)}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      {showConfiguration ? 'Hide Options' : 'Show Options'}
                    </button>
                  </div>
                  
                  {showConfiguration && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                          type="text"
                          value={chartConfiguration.title}
                          onChange={(e) => handleConfigChange('title', e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                          placeholder="Chart Title"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">X-Axis</label>
                        <select
                          value={chartConfiguration.xAxis}
                          onChange={(e) => handleConfigChange('xAxis', e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                          title="Select X-Axis Column"
                          aria-label="Select X-Axis Column"
                        >
                          <option value="">Select Column</option>
                          {columns.map((column, index) => (
                            <option key={index} value={column}>{column}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Y-Axis</label>
                        <select
                          value={chartConfiguration.yAxis}
                          onChange={(e) => handleConfigChange('yAxis', e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                          title="Select Y-Axis Column"
                          aria-label="Select Y-Axis Column"
                        >
                          <option value="">Select Column</option>
                          {columns.map((column, index) => (
                            <option key={index} value={column}>{column}</option>
                          ))}
                        </select>
                      </div>
                      
                      {(selectedChart === 'bar' || selectedChart === 'scatter') && (
                        <div>
                          <label className="block text-sm font-medium mb-1">Color By</label>
                          <select
                            value={chartConfiguration.color}
                            onChange={(e) => handleConfigChange('color', e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                            title="Select Color Column"
                            aria-label="Select Color Column"
                          >
                            <option value="">None</option>
                            {columns.map((column, index) => (
                              <option key={index} value={column}>{column}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Aggregation</label>
                        <select
                          value={chartConfiguration.aggregation}
                          onChange={(e) => handleConfigChange('aggregation', e.target.value as any)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                          title="Select Aggregation"
                          aria-label="Select Aggregation"
                        >
                          <option value="none">None</option>
                          <option value="sum">Sum</option>
                          <option value="avg">Average</option>
                          <option value="min">Minimum</option>
                          <option value="max">Maximum</option>
                          <option value="count">Count</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Filter</label>
                        <input
                          type="text"
                          value={chartConfiguration.filter}
                          onChange={(e) => handleConfigChange('filter', e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                          placeholder="e.g. age > 30"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Chart Visualization */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="mb-2 text-center font-medium">
                  {chartConfiguration.title || (selectedChart === 'table' 
                    ? 'Data Table' 
                    : `${selectedChart.charAt(0).toUpperCase() + selectedChart.slice(1)} Chart`)}
                </div>
                {renderChart()}
              </div>
            </div>
          )}
          
          {/* Insights Tab */}
          {activeTab === 'insights' && data && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Automated Insights</h2>
              
              {isAnalyzing ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p>Analyzing your data...</p>
                </div>
              ) : insights.length === 0 ? (
                <div className="text-center py-8">
                  <p>No insights generated yet. Click the button below to analyze your data.</p>
                  <button 
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
                    onClick={() => data && analyzeData(data, columns)}
                  >
                    Generate Insights
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Insights List */}
                  <div className="md:col-span-1 bg-gray-50 dark:bg-gray-700 rounded-md p-4 max-h-[600px] overflow-y-auto">
                    <h3 className="text-lg font-medium mb-3">Discovered Insights</h3>
                    <div className="space-y-3">
                      {insights.map((insight, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-md cursor-pointer transition-colors duration-200 ${selectedInsight === insight 
                            ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500' 
                            : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                          onClick={() => setSelectedInsight(insight)}
                        >
                          <div className="flex items-start">
                            <div className={`px-2 py-1 text-xs rounded-full mr-2 ${
                              insight.importance === 'high' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                                : insight.importance === 'medium'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              {insight.importance}
                            </div>
                            <h4 className="font-medium">{insight.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insight.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Insight Visualization */}
                  <div className="md:col-span-2">
                    {selectedInsight ? (
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                        <div className="mb-4">
                          <h3 className="text-lg font-medium">{selectedInsight.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400">{selectedInsight.description}</p>
                        </div>
                        {renderInsightVisualization(selectedInsight)}
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-800 p-8 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center h-full">
                        <p className="text-gray-500 dark:text-gray-400">Select an insight to view its visualization</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Statistics Tab */}
          {activeTab === 'statistics' && data && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Statistical Analysis</h2>
              
              {Object.keys(statistics).length === 0 ? (
                <div className="text-center py-8">
                  <p>No statistics available yet. Click the button below to analyze your data.</p>
                  <button 
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
                    onClick={() => data && analyzeData(data, columns)}
                  >
                    Generate Statistics
                  </button>
                </div>
              ) : (
                <div>
                  {/* Basic Statistics */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Numerical Column Statistics</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-2 border">Column</th>
                            <th className="px-4 py-2 border">Count</th>
                            <th className="px-4 py-2 border">Mean</th>
                            <th className="px-4 py-2 border">Median</th>
                            <th className="px-4 py-2 border">Min</th>
                            <th className="px-4 py-2 border">Max</th>
                            <th className="px-4 py-2 border">Std Dev</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(statistics).map((column, index) => {
                            const stats = statistics[column];
                            return (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-2 border font-medium">{column}</td>
                                <td className="px-4 py-2 border text-center">{stats.count}</td>
                                <td className="px-4 py-2 border text-center">{stats.mean.toFixed(2)}</td>
                                <td className="px-4 py-2 border text-center">{stats.median.toFixed(2)}</td>
                                <td className="px-4 py-2 border text-center">{stats.min.toFixed(2)}</td>
                                <td className="px-4 py-2 border text-center">{stats.max.toFixed(2)}</td>
                                <td className="px-4 py-2 border text-center">{stats.stdDev.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Correlation Matrix */}
                  {correlationMatrix.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Correlation Matrix</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-200">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-4 py-2 border">Column</th>
                              {correlationMatrix[0] && Object.keys(correlationMatrix[0])
                                .filter(key => key !== 'column')
                                .map(col => (
                                  <th key={col} className="px-4 py-2 border">{col}</th>
                                ))}
                            </tr>
                          </thead>
                          <tbody>
                            {correlationMatrix.map((row, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-2 border font-medium">{row.column}</td>
                                {Object.keys(row)
                                  .filter(key => key !== 'column')
                                  .map(col => {
                                    const value = row[col] as number;
                                    // Color coding based on correlation strength
                                    let bgColor = 'bg-white';
                                    if (value > 0.7) bgColor = 'bg-green-100';
                                    else if (value > 0.4) bgColor = 'bg-green-50';
                                    else if (value < -0.7) bgColor = 'bg-red-100';
                                    else if (value < -0.4) bgColor = 'bg-red-50';
                                    
                                    return (
                                      <td 
                                        key={col} 
                                        className={`px-4 py-2 border text-center ${bgColor}`}
                                      >
                                        {value.toFixed(2)}
                                      </td>
                                    );
                                  })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <p>Color coding:</p>
                        <div className="flex flex-wrap gap-4 mt-1">
                          <span className="px-2 py-1 bg-green-100 rounded">Strong positive (&gt;0.7)</span>
                          <span className="px-2 py-1 bg-green-50 rounded">Moderate positive (&gt;0.4)</span>
                          <span className="px-2 py-1 bg-red-100 rounded">Strong negative (&lt;-0.7)</span>
                          <span className="px-2 py-1 bg-red-50 rounded">Moderate negative (&lt;-0.4)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Export Statistics */}
              {Object.keys(statistics).length > 0 && (
                <div className="mt-6 flex justify-end">
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
                    onClick={() => {
                      // Create CSV of statistics
                      const headers = ['Column', 'Count', 'Mean', 'Median', 'Min', 'Max', 'StdDev'];
                      const rows = Object.keys(statistics).map(column => {
                        const stats = statistics[column];
                        return [
                          column,
                          stats.count,
                          stats.mean.toFixed(4),
                          stats.median.toFixed(4),
                          stats.min.toFixed(4),
                          stats.max.toFixed(4),
                          stats.stdDev.toFixed(4)
                        ];
                      });
                      
                      const csvContent = [
                        headers.join(','),
                        ...rows.map(row => row.join(','))
                      ].join('\n');
                      
                      // Create download link
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.setAttribute('href', url);
                      link.setAttribute('download', `statistics_${fileName.split('.')[0]}.csv`);
                      link.click();
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Export Statistics
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DataAnalystAssistant;