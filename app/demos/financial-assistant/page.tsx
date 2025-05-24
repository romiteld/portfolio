"use client"

import { useRef, useEffect, useState, RefObject, useMemo, useCallback, Fragment, ReactNode } from "react"
import FinancialChatWidget from "@/app/components/demos/FinancialChatWidget"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { TrendingUp, Activity, DollarSign, LineChart, CircleDollarSign, ArrowUp, ChevronUp as ChevronUpIcon, ChevronDown as ChevronDownIcon, BarChart as ChartBarIcon, Filter as FilterIcon, List as ListIcon, TrendingDown } from "lucide-react"
import "./financialAssistant.css" // Import our custom CSS
import { useTheme } from "next-themes"
import dynamic from 'next/dynamic';
import UserPreferences, { UserPreferencesData } from './components/UserPreferences';
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

// Minimal markdown to HTML converter for chat messages
function simpleMarkdownToHtml(text: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const formatInline = (s: string) =>
    escape(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

  const lines = text.split(/\r?\n/);
  let html = '';
  let inList = false;

  for (const line of lines) {
    const listMatch = line.match(/^[-*]\s+(.*)/);
    if (listMatch) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${formatInline(listMatch[1])}</li>`;
      continue;
    }
    if (inList) {
      html += '</ul>';
      inList = false;
    }
    if (line.trim() === '') {
      html += '<br>';
    } else {
      html += `<p>${formatInline(line)}</p>`;
    }
  }

  if (inList) html += '</ul>';
  return html;
}

// Create an inline ClientOnly component to avoid import issues
function ClientOnly({ children, fallback = null }: { children: ReactNode, fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Wait for next tick to ensure React has finished hydration
    setTimeout(() => {
      setMounted(true)
    }, 100) // Increase timeout to ensure complete hydration
    
    return () => setMounted(false)
  }, [])
  
  if (!mounted) {
    return fallback !== null ? (
      <>{fallback}</>
    ) : (
      // Simple loading placeholder instead of null
      <div className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-800 animate-pulse"></div>
    )
  }
  
  return <>{children}</>
}

// Dynamically import the chart components (client-side only)
const StockChart = dynamic(() => import('./components/StockChart'), { ssr: false });
const VolatilityChart = dynamic(() => import('./components/VolatilityChart'), { ssr: false });

// Replace all 3D imports with a simple visualization fallback component
const SimpleVisualization = () => (
  <div className="w-full h-full bg-gradient-to-b from-blue-700/20 to-blue-900/30"></div>
);

// Type definitions for data
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  sources?: { count: number; ragUsed: boolean };
}

// Updated MarketData types to handle different asset classes
interface StockData {
  type: 'stock';
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sector?: string;
  marketCap?: number | null;
  volume?: number | null;
  peRatio?: number | null;
}

interface IndexData {
  type: 'index';
  name: string;
  value: number;
  change: number; // For indices, this typically represents percentage change
}

interface CryptoData {
  type: 'crypto';
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number | null;
  volume24h?: number | null;
}

// Consolidated type for display
type MarketDataItem = StockData | IndexData | CryptoData;

// Define filter and sort types
type FilterType = 'all' | 'stocks' | 'indices' | 'crypto';
type SortType = 'symbol' | 'name' | 'price' | 'change' | 'changePercent';
type SortDirection = 'asc' | 'desc';

// Define NewsItem structure
interface NewsItem {
  id: number;
  category: string;
  timestamp: string;
  title: string;
  summary: string;
  fullContent?: string;
  source?: string;
}

// Real-time news fetching function
const fetchFinancialNews = async (): Promise<NewsItem[]> => {
  try {
    // Try to fetch news from our API endpoint
    const response = await fetch('/api/financial-assistant/news', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform API data to NewsItem format
    if (data && Array.isArray(data.articles) && data.articles.length > 0) {
      return data.articles.map((article: any, index: number) => ({
        id: index + 1,
        category: article.category || determineCategory(article.title),
        timestamp: article.publishedAt ? formatTimeAgo(new Date(article.publishedAt)) : 'Today',
        title: article.title,
        summary: article.description || article.summary || 'No description available.',
        fullContent: article.content,
        source: article.source?.name || article.sourceName || 'Financial News Source'
      }));
    }
    
    throw new Error('No articles returned from API');
  } catch (error) {
    console.error('Error fetching financial news:', error);
    // Return sample data as fallback
    return sampleNewsData;
  }
};

// Helper function to determine news category from title
const determineCategory = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('market') || lowerTitle.includes('stock') || 
      lowerTitle.includes('nasdaq') || lowerTitle.includes('dow') || 
      lowerTitle.includes('s&p') || lowerTitle.includes('bull') || 
      lowerTitle.includes('bear')) {
    return 'Markets';
  } else if (lowerTitle.includes('fed') || lowerTitle.includes('inflation') || 
             lowerTitle.includes('gdp') || lowerTitle.includes('economy') || 
             lowerTitle.includes('interest rate') || lowerTitle.includes('federal reserve')) {
    return 'Economy';
  } else if (lowerTitle.includes('oil') || lowerTitle.includes('gold') || 
             lowerTitle.includes('commodity') || lowerTitle.includes('energy') || 
             lowerTitle.includes('metals')) {
    return 'Commodities';
  } else if (lowerTitle.includes('crypto') || lowerTitle.includes('bitcoin') || 
             lowerTitle.includes('ethereum') || lowerTitle.includes('blockchain')) {
    return 'Crypto';
  }
  
  return 'Business';
};

// Helper function to format timestamps as "time ago"
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);
  
  if (diffDays > 0) {
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  } else if (diffHrs > 0) {
    return `${diffHrs} hours ago`;
  } else if (diffMin > 0) {
    return `${diffMin} minutes ago`;
  } else {
    return 'Just now';
  }
};

// Sample news data as fallback
const sampleNewsData: NewsItem[] = [
  {
    id: 1,
    category: 'Markets',
    timestamp: '2 hours ago',
    title: 'S&P 500 reaches new highs amid strong earnings reports',
    summary: 'Major indices continue upward trend as quarterly results exceed analyst expectations in tech and financial sectors.',
    fullContent: 'The S&P 500 reached new record levels today, fueled by exceptional quarterly earnings reports across multiple sectors. Tech giants like Apple, Microsoft, and Google parent Alphabet all exceeded analyst expectations, with revenue growth averaging 18% year-over-year.\n\nFinancial institutions also contributed significantly to the rally, with major banks reporting strong performance in investment banking and wealth management divisions. JP Morgan Chase saw a 22% increase in investment banking revenue, while Goldman Sachs reported record client assets under management.\n\nMarket analysts attribute this strong performance to several factors, including resilient consumer spending, continued technological adoption across industries, and the impact of AI innovations on productivity. "We\'re seeing a market that\'s responding not just to short-term performance, but to longer-term technological transformations that are reshaping entire industries," noted Sarah Chen, Chief Market Strategist at Morgan Financial.\n\nThe rally extended beyond just tech and financials, with consumer discretionary and healthcare sectors also showing strong gains. Notable performers included Tesla, which saw shares jump 5.2% after reporting better-than-expected delivery numbers, and Pfizer, which gained 3.7% following positive late-stage trial results for a new cancer treatment.\n\nVolume was notably higher than average, with over 5.2 billion shares changing hands, suggesting broad participation in the rally. Market breadth was similarly impressive, with advancers outnumbering decliners by more than 3 to 1.\n\nLooking forward, analysts remain cautiously optimistic. While valuations are somewhat elevated by historical standards, strong earnings growth may justify current price levels. However, investors should remain vigilant about potential headwinds, including inflation concerns and geopolitical tensions that could introduce volatility in the coming months.',
    source: 'Reuters'
  },
  {
    id: 2,
    category: 'Economy',
    timestamp: '5 hours ago',
    title: 'Federal Reserve signals potential pause in rate hikes',
    summary: 'Central bank officials indicate inflation pressures may be easing, suggesting a shift in monetary policy approach.',
    fullContent: 'Federal Reserve officials signaled a potential pause in their ongoing interest rate hike campaign during their latest policy meeting, according to minutes released today. The shift comes as several inflation indicators show modest easing of price pressures across the economy.\n\nThe Federal Open Market Committee (FOMC) noted that while inflation remains above their 2% long-term target, recent data suggests the aggressive rate hikes implemented over the past 18 months are beginning to have the desired effect of cooling demand without triggering a severe economic downturn.\n\n"The committee discussed at length the appropriate timing for a potential pause in rate increases," the minutes stated. "Several members expressed the view that sufficient tightening may have already been achieved, while others advocated for a more cautious approach with one additional modest increase before reassessing."\n\nMarkets reacted positively to the news, with the 10-year Treasury yield declining by 12 basis points and major stock indices advancing by approximately 1.5%. The dollar index also weakened against major currencies, reflecting expectations of a less aggressive Fed stance.\n\nEconomists widely interpreted the minutes as a significant shift in tone. "This is the clearest indication yet that the Fed believes it may be approaching the end of its tightening cycle," said Michael Rodriguez, Chief Economist at Capital Research Group. "They\'re acknowledging the progress made on inflation while remaining appropriately cautious about declaring victory too soon."\n\nRecent economic data supports this measured optimism. The Consumer Price Index rose at an annual rate of 3.2% last month, down from 3.7% in the previous reading. Core inflation, which excludes volatile food and energy prices, has shown similar moderation. Meanwhile, the labor market remains resilient, with unemployment holding steady at 3.8%.\n\nConsumer spending has slowed but not collapsed, suggesting the economy may achieve the "soft landing" that policymakers have been targeting. Retail sales declined by 0.2% last month, slightly less than the 0.3% drop economists had anticipated.\n\nThe next FOMC meeting, scheduled for early next month, will be closely watched for confirmation of this policy shift. Market participants now assign a 65% probability that the Fed will hold rates steady, up from 35% just a week ago.',
    source: 'Bloomberg'
  },
  {
    id: 3,
    category: 'Commodities',
    timestamp: 'Yesterday',
    title: 'Oil prices stabilize after recent volatility',
    summary: 'Crude markets find balance following supply concerns, with production adjustments offsetting geopolitical tensions.',
    fullContent: 'Oil prices found stable footing today after weeks of significant volatility, as supply and demand factors reached a tentative equilibrium. Brent crude settled at $82.45 per barrel, while West Texas Intermediate (WTI) closed at $78.12, both representing modest gains of less than 1%.\n\nThe stabilization comes after an OPEC+ meeting where member nations agreed to modest production increases to alleviate supply concerns. Saudi Arabia, the group\'s de facto leader, announced it would boost output by 300,000 barrels per day beginning next month, while maintaining flexibility to adjust if market conditions change.\n\n"We are responding to legitimate concerns about tight supply while remaining vigilant about market stability," said Saudi Energy Minister Prince Abdulaziz bin Salman. "Our approach is measured and responsive to actual market conditions."\n\nRecent geopolitical tensions in Eastern Europe and the Middle East had driven prices higher amid fears of supply disruptions. However, those concerns have been partially offset by signs of slowing demand growth in China, the world\'s largest oil importer. Chinese manufacturing data released yesterday showed continued contraction, suggesting lower energy consumption in the near term.\n\nU.S. production has also played a role in balancing markets. American output reached 13.2 million barrels per day last week, according to the Energy Information Administration (EIA), representing a record high. However, the rate of production growth appears to be moderating as producers exercise capital discipline.\n\n"We\'re seeing U.S. producers take a much more measured approach to investment than in previous price cycles," noted Rebecca Johnson, energy analyst at Global Resource Partners. "They\'re focused on generating returns for shareholders rather than maximizing production at all costs."\n\nInventory data has been mixed. U.S. commercial crude stockpiles fell by 3.2 million barrels last week, exceeding analyst expectations. However, gasoline inventories rose unexpectedly, suggesting some weakness in consumer demand as the summer driving season winds down.\n\nTraders are now watching several key factors that could influence prices in the coming weeks, including the next round of U.S.-Iran nuclear negotiations, hurricane season in the Gulf of Mexico, and upcoming OPEC+ compliance reports. For now, though, the market appears to have found a more stable range after months of heightened volatility.',
    source: 'Wall Street Journal'
  }
];

// --- Utility Functions ---
const formatNumber = (num: number | null | undefined, decimals = 2): string => {
  if (num === null || num === undefined) return 'N/A';
  return num.toFixed(decimals);
};

const formatLargeNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
};

// The actual page component
export default function FinancialAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [userId] = useState(`user-${Math.random().toString(36).substring(2, 12)}`)
  // States for different data types
  const [stockData, setStockData] = useState<StockData[]>([])
  const [indexData, setIndexData] = useState<IndexData[]>([])
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([])
  const [sectorData, setSectorData] = useState<{ name: string; performance: string }[]>([])
  const [isSimulated, setIsSimulated] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // States for sorting and filtering
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [userPreferences, setUserPreferences] = useState<UserPreferencesData | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
  const [newsArticles, setNewsArticles] = useState<NewsItem[]>(sampleNewsData);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  // Load initial messages and data
  useEffect(() => {
    loadHistory()
    refreshMarketData() // Initial fetch
    loadUserPreferences() // Load saved preferences
    
    const intervalId = setInterval(() => {
      refreshMarketData()
    }, 60000) // Refresh every 60 seconds
    
    if (typeof window !== 'undefined' && sceneRef.current) {
      gsap.registerPlugin(ScrollTrigger)
    }
    
    return () => {
      clearInterval(intervalId)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])
  
  // Scroll chat to bottom on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleScroll = () => {
    const container = chatContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10

    setIsScrolledUp(!isScrolledToBottom)

    if (isScrolledToBottom) {
      scrollToBottom()
    }
  }

  const loadHistory = async () => {
    try {
      const response = await fetch(`/api/market/chat?userId=${userId}`)
      const data = await response.json()
      
      if (data.history && Array.isArray(data.history)) {
        const historyMessages = data.history.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }))
        
        setMessages(historyMessages)
      }
      
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
    }
  }
  
  // Updated refreshMarketData to handle new structure
  const refreshMarketData = async () => {
    try {
      setApiError(null); // Clear previous errors
      
      const response = await fetch('/api/market/data');
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      // Check content type to ensure it's JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
      }

      // Safely parse the JSON response
      let data;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error(`Failed to parse API response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }

      // Update states with data from API
      setStockData((data.stocks || []).map((s: any) => ({ ...s, type: 'stock' })));
      setIndexData((data.indices || []).map((i: any) => ({ ...i, type: 'index' })));
      setCryptoData((data.crypto || []).map((c: any) => ({ ...c, type: 'crypto' })));
      setSectorData(data.sectors || []);
      setIsSimulated(data.isSimulated || false);
      setApiError(data.apiError || null);

      if (data.isSimulated) {
         console.warn("Displaying simulated market data.");
      }
      if (data.apiError) {
         console.error("API Error during data fetch:", data.apiError);
      }

    } catch (error) {
      console.error("Error loading market data:", error);
      setApiError(error instanceof Error ? error.message : 'Unknown error fetching data');
      // Set to simulated mode with empty data
      setStockData([]); 
      setIndexData([]); 
      setCryptoData([]);
      setSectorData([]);
      setIsSimulated(true);
    }
  }
  
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Save current page scroll position
      const pageScrollY = window.scrollY;
      
      timeoutRef.current = setTimeout(() => {
        // Don't use scrollIntoView as it affects the whole page
        // Instead, if we have access to the container, directly modify its scrollTop
        if (chatContainerRef.current) {
          const scrollHeight = chatContainerRef.current.scrollHeight;
          chatContainerRef.current.scrollTop = scrollHeight;
          
          // Restore the page's scroll position
          window.scrollTo(0, pageScrollY);
        }
        // Only use scrollIntoView as a fallback and with "auto" behavior
        else if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "auto" });
          // Restore the page's scroll position
          window.scrollTo(0, pageScrollY);
        }
      }, 100)
      setIsScrolledUp(false)
    }
  }
  
  // Updated handleSubmit to use the new query endpoint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [
      ...prev,
      userMessage,
      { role: "assistant", content: "Processing financial query...", timestamp: new Date(), isLoading: true },
    ])
    setInput("")
    setLoading(true)
    
    try {
      // Call the RENAMED API route
      const response = await fetch('/api/financial-assistant/query', { // UPDATED ROUTE
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userMessage.content,
          userPreferences: userPreferences // Include user preferences
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.summary || `API request failed with status ${response.status}`)
      }
      
      const data = await response.json()
      
      // Format the response (assuming API returns structure with summary, key_metrics etc.)
      let assistantResponseContent = `**Financial Query Results:**\n\n` // Generic title
      
      if (data.summary) {
          assistantResponseContent += `${data.summary}\n\n`
      }
      
      // Display key metrics if available (might need adjustment based on API response)
      if (data.key_metrics && Object.keys(data.key_metrics).length > 0) {
        assistantResponseContent += "**Key Metrics:**\n"
        for (const [key, value] of Object.entries(data.key_metrics)) {
           // Simple formatting, might need enhancement for tables etc.
          assistantResponseContent += `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}\n`
        }
        assistantResponseContent += "\n"
      }
      
      if (data.comparison_table) { // Example for comparison
         assistantResponseContent += `**Comparison:**\n${data.comparison_table}\n` // Assuming backend formats a markdown table
      }

      if (data.recent_news_summary) {
        assistantResponseContent += `**News/Context:**\n${data.recent_news_summary}\n`
      }

      // Fallback message if content is still minimal
      if (assistantResponseContent === `**Financial Query Results:**\n\n`) {
        assistantResponseContent = "I processed your query, but couldn't retrieve specific details. Please try rephrasing or ask about a specific stock/index."
      }
       
      // Add disclaimer for analysis/advice types
      if (data.type === 'analysis' || data.type === 'advice') { // Assuming backend adds `type`
         assistantResponseContent += `\n\n**Disclaimer:** *This information is for educational purposes only and not financial advice. Consult a qualified professional before making investment decisions.*`;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: assistantResponseContent,
        timestamp: new Date(),
      }

      setMessages(prev => [ ...prev.slice(0, -1), assistantMessage ])

    } catch (error) {
      console.error("Error fetching financial query response:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      }
      setMessages(prev => [ ...prev.slice(0, -1), errorMessage ])
    } finally {
      setLoading(false)
      setTimeout(() => chatContainerRef.current?.focus(), 0)
    }
  }
  
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Prevent the default focus behavior that might cause scrolling
    e.preventDefault()
    // Don't scroll to bottom on input focus - this prevents the auto scrolling
    // scrollToBottom() - Remove this line
  }
  
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }
  
  const formatTime = (date?: Date) => {
    if (!date) return ""
    
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date)
  }
  
  useEffect(() => {
    const chatContainer = chatContainerRef.current
    if (chatContainer) {
      const preventParentScroll = (e: WheelEvent) => {
        const { scrollTop, scrollHeight, clientHeight } = chatContainer
        
        // If we're at the top and trying to scroll up, or
        // at the bottom and trying to scroll down, prevent default
        if (
          (scrollTop === 0 && e.deltaY < 0) ||
          (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0)
        ) {
          return
        }
        
        // Otherwise prevent default to stop page scroll
        e.stopPropagation()
      }
      
      chatContainer.addEventListener('wheel', preventParentScroll)
      return () => {
        chatContainer.removeEventListener('wheel', preventParentScroll)
      }
    }
  }, [])
  
  // --- Sorting and Filtering Logic ---
  const sortedAndFilteredData = useMemo(() => {
    let combinedData: MarketDataItem[] = [];
    
    // Apply filter
    switch (filter) {
      case 'stocks':
        combinedData = [...stockData];
        break;
      case 'indices':
        combinedData = [...indexData];
        break;
      case 'crypto':
        combinedData = [...cryptoData];
        break;
      case 'all':
      default:
        combinedData = [...stockData, ...indexData, ...cryptoData];
        break;
    }
    
    // Apply sorting
    combinedData.sort((a, b) => {
      let valA: string | number | undefined;
      let valB: string | number | undefined;

      switch (sortBy) {
        case 'symbol':
           // Indices don't have a symbol, use name
           valA = (a.type === 'stock' || a.type === 'crypto') ? a.symbol : a.name;
           valB = (b.type === 'stock' || b.type === 'crypto') ? b.symbol : b.name;
           break;
        case 'name':
          valA = a.name;
          valB = b.name;
          break;
        case 'price':
          valA = a.type === 'index' ? a.value : a.price;
          valB = b.type === 'index' ? b.value : b.price;
          break;
        case 'change': // Sort by absolute change value for stocks/crypto, % for indices
          valA = a.type === 'index' ? a.change : (a.type === 'stock' || a.type === 'crypto' ? a.change : 0);
          valB = b.type === 'index' ? b.change : (b.type === 'stock' || b.type === 'crypto' ? b.change : 0);
          break;
        case 'changePercent': // Sort by % change for stocks/crypto, already % for indices
           valA = a.type === 'index' ? a.change : (a.type === 'stock' || a.type === 'crypto' ? a.changePercent : 0);
           valB = b.type === 'index' ? b.change : (b.type === 'stock' || b.type === 'crypto' ? b.changePercent : 0);
           break;
        default:
          return 0;
      }

      // Handle potential undefined values and type differences
      const comparison = 
         (valA === undefined || valA === null) ? -1 : 
         (valB === undefined || valB === null) ? 1 : 
         (typeof valA === 'string' && typeof valB === 'string') ? valA.localeCompare(valB) :
         (valA < valB) ? -1 :
         (valA > valB) ? 1 : 0;

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return combinedData;
  }, [stockData, indexData, cryptoData, filter, sortBy, sortDirection]);

  const handleSortChange = (newSortBy: SortType) => {
    if (newSortBy === sortBy) {
      // Toggle direction if same column clicked
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Reset to ascending for new column
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  };

  // Load user preferences from localStorage
  const loadUserPreferences = () => {
    if (typeof window === 'undefined') return
    
    try {
      const savedPrefs = localStorage.getItem('financialAssistantPreferences')
      if (savedPrefs) {
        setUserPreferences(JSON.parse(savedPrefs))
      }
    } catch (error) {
      console.error("Error loading user preferences:", error)
    }
  }
  
  // Save user preferences handler
  const handleSavePreferences = (preferences: UserPreferencesData) => {
    setUserPreferences(preferences)
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('financialAssistantPreferences', JSON.stringify(preferences))
    }
  }

  // Add useEffect to monitor isModalOpen state
  useEffect(() => {
    console.log('Modal state changed:', isModalOpen);
  }, [isModalOpen]);

  const handleNewsItemClick = (newsItem: NewsItem) => {
    setSelectedNewsItem(newsItem);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log('Closing modal');
    setIsModalOpen(false);
    // Completely reset the modal after closing
    setTimeout(() => {
      setSelectedNewsItem(null);
    }, 300);
  };

  // Fetch news articles on component mount
  useEffect(() => {
    const getNewsArticles = async () => {
      setIsLoadingNews(true);
      try {
        const articles = await fetchFinancialNews();
        setNewsArticles(articles);
      } catch (error) {
        console.error('Failed to fetch news articles:', error);
        // Keep using sample data if fetch fails
      } finally {
        setIsLoadingNews(false);
      }
    };
    
    getNewsArticles();
    
    // Set up a refresh interval (every 30 minutes)
    const refreshInterval = setInterval(() => {
      getNewsArticles();
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Render the 3D scene backgrounds
  return (
    <>
      <div className="w-full min-h-screen bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white relative overflow-hidden" ref={sceneRef}>
        {/* Replace 3D scene with simple background */}
        <div className="fixed inset-0 w-screen h-screen pointer-events-none z-0">
          <SimpleVisualization />
        </div>
        
        {/* Content */}
        <div className="container-fluid mx-auto pt-16 pb-12 px-4 md:px-8 lg:px-12 relative z-10">
          <div className="max-w-[1440px] mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-center text-gray-900 dark:text-white mb-2 glow-text">
              Financial Market Assistant
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 text-center mb-12">
              AI-powered real-time financial analysis, market insights, comparisons, and portfolio guidance.
            </p>
            
            {/* Add a className to the content container to make it more responsive */}
            <div className="flex flex-col lg:flex-row gap-8 min-h-[650px]">
              {/* Chat Interface (widened) */}
              <div className="flex-1 bg-white/95 dark:bg-[#1e293b]/80 rounded-xl overflow-hidden backdrop-blur-lg shadow-xl border border-gray-300 dark:border-gray-800 flex flex-col min-h-0 md:h-[600px] md:max-h-[600px]">
                <div
                  className="flex-1 overflow-y-auto p-6 relative"
                  ref={chatContainerRef}
                  onScroll={handleScroll}
                >
                  {/* User Preferences Component */}
                  <UserPreferences 
                    onSave={handleSavePreferences}
                    initialPreferences={userPreferences || undefined}
                  />
                  
                  {/* ... (Chat message rendering logic remains the same) ... */}
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="bg-primary-500/10 p-4 rounded-full mb-4">
                        <CircleDollarSign size={40} className="text-primary-500" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Financial Assistant</h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                        Ask about market trends, stock analysis (e.g., AAPL), crypto (e.g., BTC-USD), comparisons, or strategies.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex mb-6 ${
                            message.role === "assistant" ? "justify-start" : "justify-end"
                          }`}
                        >
                          <div 
                            className={`p-4 max-w-[90%] chat-message ${
                              message.role === "assistant"
                                ? "bg-gray-200 dark:bg-gray-800 rounded-tl-none shadow-md border border-gray-300 dark:border-gray-700 chat-message-assistant"
                                : "bg-primary-600 rounded-tr-none shadow-md border border-primary-700 chat-message-user"
                            }`}
                          >
                            {message.isLoading ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-0"></div>
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-150"></div>
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-300"></div>
                              </div>
                            ) : (
                              <>
                                {/* Enhanced prose settings for markdown, tables, etc. */}
                                <div
                                  className="prose prose-sm dark:prose-invert max-w-none prose-headings:my-2 prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-table:text-xs prose-thead:bg-gray-100 dark:prose-thead:bg-gray-700 prose-td:px-2 prose-td:py-1 prose-th:px-2 prose-th:py-1 chat-message-content"
                                  dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(message.content) }}
                                />
                                <div className="text-xs mt-1 opacity-80">
                                  {formatTime(message.timestamp)}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                  {isScrolledUp && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        scrollToBottom()
                      }}
                      className="absolute bottom-4 right-4 z-10 p-2 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors"
                      aria-label="Scroll to bottom"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <polyline points="19 12 12 19 5 12"></polyline>
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Input form */}
                <form 
                  onSubmit={handleSubmit}
                  className="border-t border-gray-200 dark:border-gray-700 p-4 chat-input-container" 
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onFocus={handleInputFocus} 
                      disabled={loading}
                      placeholder="Ask about stocks (AAPL), crypto (BTC-USD), comparisons..."
                      className="flex-1 rounded-lg border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-md chat-input"
                    />
                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className={`rounded-lg px-6 py-2 text-white font-medium transition-colors shadow-lg min-w-[80px] send-button ${
                        loading || !input.trim() 
                          ? "bg-gray-400 dark:bg-gray-600" 
                          : "bg-primary-600 hover:bg-primary-700"
                      }`}
                    >
                      {loading ? (
                        <span className="flex justify-center items-center">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping mr-1"></span>
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping animation-delay-200 mr-1"></span>
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping animation-delay-400"></span>
                        </span>
                      ) : "Send"}
                    </button>
                  </div>
                  
                  {/* Suggestions unchanged */}
                </form>
              </div>
              
              {/* Market Data Section */}
              <div className="lg:w-2/5 bg-white/95 dark:bg-[#1e293b]/80 rounded-xl backdrop-blur-lg shadow-xl border border-gray-300 dark:border-gray-800 p-6 market-card flex flex-col h-[600px] max-h-[600px]">
                {/* Sidebar Header & Controls */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 shrink-0"> {/* Added shrink-0 */} 
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                       <ChartBarIcon className="w-5 h-5 text-primary-500 mr-2" />
                       <h3 className="font-medium text-gray-900 dark:text-white">Market Data</h3>
                    </div>
                    <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded ${
                       isSimulated 
                         ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' 
                         : 'bg-green-500/10 text-green-600 dark:text-green-400'
                     }`}>
                      {isSimulated ? 'Simulated' : 'Live'}
                    </span>
                  </div>
                  {/* Filter Buttons */}
                  <div className="flex gap-1 mb-2">
                     {(['all', 'stocks', 'indices', 'crypto'] as FilterType[]).map(f => (
                        <button 
                           key={f}
                           onClick={() => setFilter(f)}
                           className={`flex-1 text-xs px-2 py-1 rounded transition-colors border ${ 
                             filter === f 
                               ? 'bg-primary-600 text-white border-primary-700' 
                               : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                           }`}
                        >
                           {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                     ))}
                  </div>
                   {/* API Error Display */}
                   {apiError && (
                     <div className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 p-1 rounded border border-red-500/20">
                        ⚠️ {apiError}
                     </div>
                   )}
                </div>
                 
                {/* Sidebar Data Table - Make this div scrollable */}
                <div className="market-data-container flex-1 overflow-y-auto">
                   <table className="market-data-table w-full text-xs text-left table-fixed">
                     <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 z-10">
                        <tr>
                           {/* Symbol/Name Column */}
                           <th 
                             className="p-2 w-[35%] cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" 
                             onClick={() => handleSortChange('symbol')}
                           >
                              <div className="flex items-center">
                                 {filter === 'indices' ? 'Index' : 'Symbol'}
                                 {sortBy === 'symbol' && (
                                    sortDirection === 'asc' ? <ChevronUpIcon className="w-3 h-3 ml-1" /> : <ChevronDownIcon className="w-3 h-3 ml-1" />
                                 )}
                              </div>
                           </th>
                           {/* Price/Value Column */}
                           <th 
                             className="p-2 w-[30%] text-right cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" 
                             onClick={() => handleSortChange('price')}
                            >
                              <div className="flex items-center justify-end">
                                {filter === 'indices' ? 'Value' : 'Price'}
                                {sortBy === 'price' && (
                                   sortDirection === 'asc' ? <ChevronUpIcon className="w-3 h-3 ml-1" /> : <ChevronDownIcon className="w-3 h-3 ml-1" />
                                )}
                             </div>
                           </th>
                           {/* Change Column */}
                           <th 
                             className="p-2 w-[35%] text-right cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" 
                             onClick={() => handleSortChange('changePercent')}
                            >
                              <div className="flex items-center justify-end">
                                Change %
                                {sortBy === 'changePercent' && (
                                   sortDirection === 'asc' ? <ChevronUpIcon className="w-3 h-3 ml-1" /> : <ChevronDownIcon className="w-3 h-3 ml-1" />
                                )}
                             </div>
                           </th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedAndFilteredData.map((item, index) => (
                           <tr key={item.type + '-' + (item.type === 'index' ? item.name : item.symbol) + '-' + index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              {/* Symbol/Name Cell */}
                              <td className="p-2 truncate">
                                 <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {item.type === 'index' ? item.name : item.symbol}
                                 </div>
                                 {item.type !== 'index' && (
                                    <div className="text-gray-500 dark:text-gray-400 truncate text-[11px]">
                                      {item.name}
                                    </div>
                                 )}
                              </td>
                              {/* Price/Value Cell */}
                              <td className="p-2 text-right">
                                 <div className="font-mono font-medium text-gray-900 dark:text-gray-100">
                                    {(item.type === 'index' ? item.value : item.price).toFixed(2)}
                                 </div>
                              </td>
                              {/* Change Cell */}
                              <td className="p-2 text-right">
                                 <div className={`font-medium flex items-center justify-end ${ 
                                   (item.type === 'index' ? item.change : item.changePercent) >= 0 
                                     ? "text-green-600 dark:text-green-400" 
                                     : "text-red-600 dark:text-red-400"
                                 }`}>
                                    {(item.type === 'index' ? item.change : item.changePercent) >= 0 ? (
                                       <TrendingUp className="w-3 h-3 mr-0.5" />
                                    ) : (
                                       <TrendingDown className="w-3 h-3 mr-0.5" />
                                    )}
                                    {(item.type === 'index' ? item.change : item.changePercent) >= 0 ? "+" : ""}
                                    {(item.type === 'index' ? item.change : item.changePercent).toFixed(2)}%
                                 </div>
                                 {(item.type === 'stock' || item.type === 'crypto') && (
                                    <div className={`text-[11px] ${item.change >= 0 ? "text-green-600/80 dark:text-green-400/80" : "text-red-600/80 dark:text-red-400/80"}`}>
                                       {item.change >= 0 ? "+" : ""}
                                       {item.change.toFixed(2)}
                                    </div>
                                 )}
                              </td>
                           </tr>
                        ))}
                        {/* Show loading or no data message */} 
                        {sortedAndFilteredData.length === 0 && (
                           <tr>
                              <td colSpan={3} className="p-4 text-center text-gray-500 dark:text-gray-400">
                                 {loading ? 'Loading data...' : 'No data available for this filter.'}
                              </td>
                           </tr>
                        )}
                     </tbody>
                   </table>
                </div>

                {/* Sector Performance Footer (Optional) */}
                {/* 
                <div className="p-3 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700">
                   <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-xs">Sector Performance</h4>
                   <ul className="text-xs space-y-1">
                      {sectorData.slice(0, 5).map(sector => (
                         <li key={sector.name} className="flex justify-between">
                           <span className="text-gray-600 dark:text-gray-400 truncate pr-2">• {sector.name}</span>
                           <span className={`${parseFloat(sector.performance) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {parseFloat(sector.performance) >= 0 ? '+' : ''}{sector.performance}%
                           </span>
                         </li>
                      ))}
                   </ul>
                </div>
                */} 
              </div>
            </div>
            
            {/* Volatility Analysis Section - Make this scrollable too */}
            <div className="mt-10 mb-8 bg-white/90 dark:bg-[#1e293b]/80 rounded-xl overflow-hidden backdrop-blur-lg shadow-xl border border-gray-300 dark:border-gray-800 p-6 max-h-[700px] overflow-y-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold inline-flex items-center gap-2 justify-center">
                  <Activity className="text-primary-500" size={24} />
                  Market Volatility Analysis
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Analyze market volatility across different regimes
                </div>
              </div>
              
              <div className="mb-8 volatility-chart-container">
                <VolatilityChart 
                  symbol={sortedAndFilteredData.length > 0 ? 
                    (sortedAndFilteredData[0].type === 'index' ? 
                      sortedAndFilteredData[0].name : 
                      sortedAndFilteredData[0].symbol) : 
                    "SPY"}
                  showHistoricalVol={true}
                  showImpliedVol={true}
                  showVix={true}
                  timeRange="3m"
                  height={300} /* Reduced height from 400 to 300 */
                />
              </div>
              
              <h3 className="text-xl font-semibold mb-4 text-center">Compare Volatility Regimes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8"> {/* Grid for all volatility examples */}
                <div className="overflow-hidden bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md">
                  <div className="flex flex-col">
                    <h4 className="text-lg font-medium p-4 pb-2 text-center">Low Volatility Example</h4>
                    <div className="px-4 pb-2 flex justify-center">
                      <div className="mb-2 px-2 py-1 rounded inline-flex items-center gap-1 whitespace-nowrap w-fit bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                        <Activity size={14} />
                        Low Volatility
                      </div>
                    </div>
                  </div>
                  <div className="checkbox-container px-4 pb-2 flex gap-4 justify-center">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      Historical Volatility
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={false}
                        readOnly
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      Implied Volatility
                    </label>
                  </div>
                  <div className="px-1 py-1 volatility-chart-container">
                    <VolatilityChart 
                      symbol="LOW-VOL-DEMO" 
                      title=""
                      height={280}
                      showHistoricalVol={true}
                      showImpliedVol={false}
                      timeRange="3m"
                    />
                  </div>
                </div>
                
                <div className="overflow-hidden bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md">
                  <div className="flex flex-col">
                    <h4 className="text-lg font-medium p-4 pb-2 text-center">High Volatility Example</h4>
                    <div className="px-4 pb-2 flex justify-center">
                      <div className="mb-2 px-2 py-1 rounded inline-flex items-center gap-1 whitespace-nowrap w-fit bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                        <Activity size={14} />
                        High Volatility
                      </div>
                    </div>
                  </div>
                  <div className="checkbox-container px-4 pb-2 flex gap-4 justify-center">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      Historical Volatility
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      Implied Volatility
                    </label>
                  </div>
                  <div className="px-1 py-1 volatility-chart-container">
                    <VolatilityChart 
                      symbol="HIGH-VOL-DEMO" 
                      title=""
                      height={280}
                      showHistoricalVol={true}
                      showImpliedVol={true}
                      timeRange="3m"
                    />
                  </div>
                </div>
                
                <div className="overflow-hidden bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md">
                  <div className="flex flex-col">
                    <h4 className="text-lg font-medium p-4 pb-2 text-center">Market Crisis Example</h4>
                    <div className="px-4 pb-2 flex justify-center">
                      <div className="mb-2 px-2 py-1 rounded inline-flex items-center gap-1 whitespace-nowrap w-fit bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        <Activity size={14} />
                        Extreme Volatility
                      </div>
                    </div>
                  </div>
                  <div className="checkbox-container px-4 pb-2 flex gap-4 justify-center">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      Historical Volatility
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      Implied Volatility
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      VIX Volatility
                    </label>
                  </div>
                  <div className="px-1 py-1 volatility-chart-container">
                    <VolatilityChart 
                      symbol="EXTREME-VOL-DEMO" 
                      title=""
                      height={280}
                      showHistoricalVol={true}
                      showImpliedVol={true}
                      showVix={true}
                      timeRange="3m"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Financial News Reel Section - Make this scrollable too */}
            <div className="mt-8 bg-white/90 dark:bg-[#1e293b]/80 rounded-xl overflow-hidden backdrop-blur-lg shadow-xl border border-gray-300 dark:border-gray-800 p-6 max-h-[600px] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Financial News & Insights
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Latest market updates and economic developments
                </div>
              </div>
              
              {isLoadingNews ? (
                <div className="flex items-center justify-center p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {newsArticles.slice(0, 3).map((newsItem) => (
                    <div 
                      key={newsItem.id}
                      className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleNewsItemClick(newsItem)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          newsItem.category === 'Markets' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                          newsItem.category === 'Economy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                          newsItem.category === 'Commodities' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          newsItem.category === 'Crypto' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400'
                        }`}>
                          {newsItem.category}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {newsItem.timestamp}
                        </div>
                      </div>
                      <h3 className="mt-2 font-semibold text-gray-900 dark:text-white">
                        {newsItem.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {newsItem.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Updated every 30 minutes
                </div>
              </div>
            </div>
            
            {/* Disclaimer */}
            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>
                All financial information is for educational purposes only.
                <br />
                Past performance does not guarantee future results. Consider consulting a financial advisor before investing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* News Article Modal */}
      <Transition show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <div className="fixed inset-0 z-10">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={closeModal}
            />
          </div>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                      onClick={closeModal}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  
                  {selectedNewsItem && (
                    <div>
                      <div className="mb-4">
                        {/* Category and timestamp in first row */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`px-2 py-1 rounded text-xs font-medium
                            ${selectedNewsItem?.category === 'Markets' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                              selectedNewsItem?.category === 'Economy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                            {selectedNewsItem?.category}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedNewsItem?.timestamp}
                          </div>
                        </div>
                        
                        {/* Source information in its own row with plenty of space */}
                        {selectedNewsItem?.source && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            <span className="font-medium">Source:</span> {selectedNewsItem?.source}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                        {selectedNewsItem?.title}
                      </h3>
                      
                      <div className="mt-2 space-y-4">
                        <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-line">
                          {selectedNewsItem?.fullContent || selectedNewsItem?.summary}
                        </p>
                      </div>
                      
                      <div className="mt-5 sm:mt-6">
                        <button
                          type="button"
                          className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                          onClick={closeModal}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Transition>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
} 