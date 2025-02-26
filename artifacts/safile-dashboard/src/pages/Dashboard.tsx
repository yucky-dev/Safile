import { useGetDashboardSummary, useGetBackupTrend, useGetWardCoverage, useListBackups } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Database, ShieldCheck, Server, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: trend, isLoading: isLoadingTrend } = useGetBackupTrend();
  const { data: coverage, isLoading: isLoadingCoverage } = useGetWardCoverage();
  const { data: backups, isLoading: isLoadingBackups } = useListBackups({ limit: 5 });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of EHR backup operations and storage health.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connectors</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{summary?.activeConnectors} / {summary?.totalConnectors}</div>
                <p className="text-xs text-muted-foreground">EHR systems syncing</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup Success Rate</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{(summary?.successRate || 0).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Over all time</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Data Secured</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{formatBytes(summary?.totalSizeBytes || 0)}</div>
                <p className="text-xs text-muted-foreground">{summary?.totalRecordsBacked.toLocaleString()} records encrypted</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sia Storage Nodes</CardTitle>
            <Server className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{summary?.onlineNodes} Online</div>
                <p className="text-xs text-muted-foreground">Active indexd gateways</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Trend Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Backup Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoadingTrend ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-[250px]" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => format(new Date(val), 'MMM dd')}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(val) => `${val}`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      labelFormatter={(val) => format(new Date(val), 'MMM dd, yyyy')}
                    />
                    <Area type="monotone" dataKey="success" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSuccess)" name="Successful" />
                    <Area type="monotone" dataKey="failed" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorFailed)" name="Failed" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ward Coverage */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Coverage by Ward</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoadingCoverage ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-[250px]" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coverage} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="ward" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      cursor={{fill: 'hsl(var(--muted))'}}
                    />
                    <Bar dataKey="records" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} name="Records" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Backups List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Snapshots</CardTitle>
          <Link href="/backups">
            <span className="text-sm text-primary hover:underline cursor-pointer">View All</span>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoadingBackups ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {backups?.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${backup.status === 'completed' ? 'bg-primary/20 text-primary' : backup.status === 'failed' ? 'bg-destructive/20 text-destructive' : 'bg-chart-3/20 text-chart-3'}`}>
                      {backup.status === 'completed' ? <ShieldCheck className="h-4 w-4" /> : backup.status === 'failed' ? <AlertTriangle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{backup.connectorName}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(backup.startedAt), 'PPpp')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={backup.status === 'completed' ? 'default' : backup.status === 'failed' ? 'destructive' : 'secondary'}>
                      {backup.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{backup.successRecords} records • {formatBytes(backup.totalSizeBytes)}</p>
                  </div>
                </div>
              ))}
              {!backups?.length && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No backups found.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
