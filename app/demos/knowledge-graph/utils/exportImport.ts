import { demoNodes, connections } from './demoData';

export interface ExportData {
  version: string;
  timestamp: string;
  nodes: typeof demoNodes;
  connections: typeof connections;
  state?: {
    selectedNode: string | null;
    filter: {
      categories: string[];
      techStack: string[];
      searchTerm: string;
    };
    viewMode: string;
  };
}

export class GraphExportImport {
  static exportToJSON(currentState?: ExportData['state']): string {
    const exportData: ExportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      nodes: demoNodes,
      connections: connections,
      state: currentState
    };

    return JSON.stringify(exportData, null, 2);
  }

  static exportToCSV(): string {
    // Export nodes
    const nodeHeaders = ['ID', 'Name', 'Category', 'Status', 'Complexity', 'Tech Stack', 'Features'];
    const nodeRows = demoNodes.map(node => [
      node.id,
      node.name,
      node.category,
      node.status,
      node.complexity.toString(),
      node.techStack.join('; '),
      node.features.join('; ')
    ]);

    const nodesCSV = [
      nodeHeaders.join(','),
      ...nodeRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Export connections
    const connectionHeaders = ['ID', 'Source', 'Target', 'Type', 'Strength', 'Bidirectional', 'Description'];
    const connectionRows = connections.map(conn => [
      conn.id,
      conn.source,
      conn.target,
      conn.type,
      conn.strength.toString(),
      conn.bidirectional.toString(),
      conn.description
    ]);

    const connectionsCSV = [
      connectionHeaders.join(','),
      ...connectionRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return `NODES\n${nodesCSV}\n\nCONNECTIONS\n${connectionsCSV}`;
  }

  static downloadFile(content: string, filename: string, type: 'json' | 'csv') {
    const mimeType = type === 'json' ? 'application/json' : 'text/csv';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async importFromJSON(file: File): Promise<ExportData | null> {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;
      
      // Validate the data structure
      if (!data.version || !data.nodes || !data.connections) {
        throw new Error('Invalid file format');
      }

      return data;
    } catch (error) {
      console.error('Error importing JSON:', error);
      return null;
    }
  }

  static generateAnalyticsReport(sessions: any[]): string {
    const report = {
      totalSessions: sessions.length,
      avgSessionDuration: sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / sessions.length,
      mostClickedNodes: {} as Record<string, number>,
      popularSearchTerms: [] as string[],
      filterUsage: {} as Record<string, number>
    };

    // Aggregate data from sessions
    sessions.forEach(session => {
      if (session.interactions) {
        // Node clicks
        Object.entries(session.interactions.nodeClicks || {}).forEach(([nodeId, count]) => {
          report.mostClickedNodes[nodeId] = (report.mostClickedNodes[nodeId] || 0) + (count as number);
        });

        // Search terms
        (session.interactions.searchTerms || []).forEach((term: string) => {
          if (!report.popularSearchTerms.includes(term)) {
            report.popularSearchTerms.push(term);
          }
        });

        // Filter usage
        Object.entries(session.interactions.filterUsage || {}).forEach(([filter, count]) => {
          report.filterUsage[filter] = (report.filterUsage[filter] || 0) + (count as number);
        });
      }
    });

    return JSON.stringify(report, null, 2);
  }
}