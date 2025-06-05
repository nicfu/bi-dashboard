
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { 
  DashboardData, 
  DashboardSummary, 
  DashboardFilter, 
  ExternalApiData 
} from '../../server/src/schema';

type MetricType = 'revenue' | 'jobs' | 'customers' | 'performance';

function App() {
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [externalData, setExternalData] = useState<ExternalApiData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filter, setFilter] = useState<DashboardFilter>({
    limit: 50
  });
  const [activeTab, setActiveTab] = useState<string>('overview');

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dataResult, summaryResult] = await Promise.all([
        trpc.getDashboardData.query(filter),
        trpc.getDashboardSummary.query()
      ]);
      setDashboardData(dataResult);
      setSummary(summaryResult);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const loadExternalData = useCallback(async () => {
    try {
      const result = await trpc.fetchExternalData.query();
      setExternalData(result);
    } catch (error) {
      console.error('Failed to load external API data:', error);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await trpc.syncDashboardData.mutate();
      await loadDashboardData(); // Refresh data after sync
      alert('✅ Data synchronized successfully!');
    } catch (error) {
      console.error('Failed to sync data:', error);
      alert('❌ Failed to sync data. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFilterChange = (key: keyof DashboardFilter, value: string) => {
    setFilter((prev: DashboardFilter) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
  };

  const getMetricIcon = (type: MetricType) => {
    switch (type) {
      case 'revenue': return '💰';
      case 'jobs': return '🔧';
      case 'customers': return '👥';
      case 'performance': return '📊';
      default: return '📈';
    }
  };

  const formatMetricValue = (value: number, type: MetricType) => {
    if (type === 'revenue') {
      return `$${value.toLocaleString()}`;
    }
    if (type === 'performance') {
      return `${value}%`;
    }
    return value.toLocaleString();
  };

  const getFilteredDataByType = (type: MetricType) => {
    return dashboardData.filter((item: DashboardData) => item.metric_type === type);
  };

  const getLatestMetricsByType = () => {
    const types: MetricType[] = ['revenue', 'jobs', 'customers', 'performance'];
    return types.map((type: MetricType) => {
      const typeData = getFilteredDataByType(type);
      const latest = typeData.sort((a: DashboardData, b: DashboardData) => 
        new Date(b.date_recorded).getTime() - new Date(a.date_recorded).getTime()
      )[0];
      return { type, data: latest };
    }).filter(item => item.data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                📊 Business Intelligence Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                Real-time insights from your business operations
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={loadExternalData} 
                variant="outline"
                className="bg-white hover:bg-gray-50"
              >
                🔄 Fetch External Data
              </Button>
              <Button 
                onClick={handleSync} 
                disabled={isSyncing}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isSyncing ? '⏳ Syncing...' : '🔄 Sync Data'}
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-indigo-600">
                    {summary.total_metrics}
                  </div>
                  <div className="text-sm text-gray-600">Total Metrics</div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {summary.sources.length}
                  </div>
                  <div className="text-sm text-gray-600">Data Sources</div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm font-semibold text-gray-700">
                    Last Updated
                  </div>
                  <div className="text-sm text-gray-600">
                    {summary.latest_update.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {summary.sources.map((source: string) => (
                      <Badge key={source} variant="secondary" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">🔍 Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Metric Type</label>
                <Select 
                  value={filter.metric_type || 'all'} 
                  onValueChange={(value: string) => handleFilterChange('metric_type', value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="revenue">💰 Revenue</SelectItem>
                    <SelectItem value="jobs">🔧 Jobs</SelectItem>
                    <SelectItem value="customers">👥 Customers</SelectItem>
                    <SelectItem value="performance">📊 Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Source</label>
                <Select 
                  value={filter.source || 'all'} 
                  onValueChange={(value: string) => handleFilterChange('source', value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="external_api">External API</SelectItem>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                    <SelectItem value="simpro">Simpro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Limit</label>
                <Select 
                  value={filter.limit?.toString() || '50'} 
                  onValueChange={(value: string) => handleFilterChange('limit', value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white">
            <TabsTrigger value="overview">📈 Overview</TabsTrigger>
            <TabsTrigger value="metrics">📊 All Metrics</TabsTrigger>
            <TabsTrigger value="external">🌐 External Data</TabsTrigger>
            <TabsTrigger value="by-type">🏷️ By Type</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getLatestMetricsByType().map(({ type, data }) => (
                <Card key={type} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getMetricIcon(type)}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {formatMetricValue(data.metric_value, type)}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {data.metric_name}
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{data.date_recorded.toLocaleDateString()}</span>
                      <Badge variant="outline" className="text-xs">
                        {data.source}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {dashboardData.length === 0 && !isLoading && (
              <Alert>
                <AlertDescription>
                  No dashboard data available. Try syncing data from external sources or check your filters.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* All Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-lg">⏳ Loading dashboard data...</div>
              </div>
            ) : (
              <div className="grid gap-4">
                {dashboardData.map((item: DashboardData) => (
                  <Card key={item.id} className="bg-white shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getMetricIcon(item.metric_type)}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.metric_name}</h3>
                            <div className="text-2xl font-bold text-indigo-600">
                              {formatMetricValue(item.metric_value, item.metric_type)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-2">
                            {item.metric_type}
                          </Badge>
                          <div className="text-sm text-gray-600">
                            {item.date_recorded.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Source: {item.source}</span>
                        <span>Created: {item.created_at.toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* External Data Tab */}
          <TabsContent value="external" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">🌐 External API Data</h2>
              <Button onClick={loadExternalData} variant="outline">
                🔄 Refresh External Data
              </Button>
            </div>
            
            {externalData.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No external data loaded. Click "Fetch External Data" to load data from external APIs.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4">
                {externalData.map((item: ExternalApiData, index: number) => (
                  <Card key={index} className="bg-white shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getMetricIcon(item.type)}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.metric}</h3>
                            <div className="text-2xl font-bold text-green-600">
                              {formatMetricValue(item.value, item.type)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="mb-2">
                            External
                          </Badge>
                          <div className="text-sm text-gray-600">
                            {item.timestamp}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Source: {item.source}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* By Type Tab */}
          <TabsContent value="by-type" className="space-y-6">
            {(['revenue', 'jobs', 'customers', 'performance'] as MetricType[]).map((type: MetricType) => {
              const typeData = getFilteredDataByType(type);
              return (
                <Card key={type} className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getMetricIcon(type)}
                      {type.charAt(0).toUpperCase() + type.slice(1)} Metrics
                      <Badge variant="secondary">{typeData.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typeData.length === 0 ? (
                      <p className="text-gray-500 italic">No {type} metrics available</p>
                    ) : (
                      <div className="grid gap-3">
                        {typeData.slice(0, 5).map((item: DashboardData) => (
                          <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">{item.metric_name}</div>
                              <div className="text-sm text-gray-600">
                                {item.date_recorded.toLocaleDateString()} • {item.source}
                              </div>
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              {formatMetricValue(item.metric_value, type)}
                            </div>
                          </div>
                        ))}
                        {typeData.length > 5 && (
                          <div className="text-center text-sm text-gray-500 mt-2">
                            ... and {typeData.length - 5} more {type} metrics
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
