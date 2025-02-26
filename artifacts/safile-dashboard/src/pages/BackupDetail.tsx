import { useGetBackup, useListBackupRecords } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowLeft, ShieldCheck, ShieldAlert, Hash } from "lucide-react";
import { Link, useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export function BackupDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  
  const { data: backup, isLoading: isLoadingBackup } = useGetBackup(id, { query: { enabled: !!id } });
  const { data: records, isLoading: isLoadingRecords } = useListBackupRecords(id, { query: { enabled: !!id } });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoadingBackup) {
    return <div className="space-y-6"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!backup) {
    return <div className="text-center py-12">Backup not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/backups">
          <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Snapshot #{backup.id.toString().padStart(6, '0')}</h1>
          <p className="text-muted-foreground text-sm">Connector: {backup.connectorName} • {format(new Date(backup.startedAt), 'PPpp')}</p>
        </div>
        <div className="flex-1" />
        <Badge variant={backup.status === 'completed' ? 'default' : backup.status === 'failed' ? 'destructive' : 'secondary'} className="text-lg px-3 py-1">
          {backup.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Records</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{backup.totalRecords.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Successful / Failed</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{backup.successRecords.toLocaleString()} <span className="text-muted-foreground text-sm font-normal">/</span> <span className="text-destructive">{backup.failedRecords.toLocaleString()}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Size</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatBytes(backup.totalSizeBytes)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Duration</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{backup.durationMs ? `${(backup.durationMs / 1000).toFixed(1)}s` : '—'}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Encrypted Records Registry</CardTitle>
          <CardDescription>Individual patient records encrypted and synced to Sia storage during this snapshot.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Name (Encrypted)</TableHead>
                <TableHead>Ward</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Integrity Hash</TableHead>
                <TableHead className="text-right">Verification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingRecords ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading records...</TableCell>
                </TableRow>
              ) : records?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records in this snapshot.</TableCell>
                </TableRow>
              ) : (
                records?.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-xs">{record.patientId}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate">{record.patientName}</TableCell>
                    <TableCell>{record.ward}</TableCell>
                    <TableCell>{formatBytes(record.sizeBytes)}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-xs font-mono bg-muted/50 px-2 py-1 rounded max-w-[250px] truncate">
                        <Hash className="w-3 h-3 mr-2 shrink-0 text-muted-foreground" />
                        <span className="truncate">{record.indexdHash}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {record.verified ? (
                        <div className="flex items-center justify-end text-primary">
                          <ShieldCheck className="w-4 h-4 mr-1" />
                          <span className="text-xs font-medium">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end text-destructive">
                          <ShieldAlert className="w-4 h-4 mr-1" />
                          <span className="text-xs font-medium">Failed</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
