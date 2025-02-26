import { useListBackups, useTriggerBackup, useListEhrConnectors, getListBackupsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Database, Plus, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function Backups() {
  const { data: backups, isLoading } = useListBackups();
  const { data: connectors } = useListEhrConnectors();
  const triggerMutation = useTriggerBackup();
  const [isTriggerOpen, setIsTriggerOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleTrigger = () => {
    if (!selectedConnector) return;
    
    triggerMutation.mutate(
      { data: { connectorId: parseInt(selectedConnector), keyId: 1 } }, // Mock keyId for now as per spec
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBackupsQueryKey() });
          setIsTriggerOpen(false);
          toast({ title: "Backup triggered successfully" });
        },
        onError: (err: any) => {
          toast({ title: "Failed to trigger backup", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Backup History</h1>
          <p className="text-muted-foreground text-sm">View and verify cryptographic snapshots of EHR data.</p>
        </div>
        <Dialog open={isTriggerOpen} onOpenChange={setIsTriggerOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Manual Backup</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Trigger Manual Backup</DialogTitle>
              <DialogDescription>Start an immediate encrypted snapshot for a specific connector.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">Select Connector</label>
              <Select value={selectedConnector} onValueChange={setSelectedConnector}>
                <SelectTrigger>
                  <SelectValue placeholder="Select EHR Connector" />
                </SelectTrigger>
                <SelectContent>
                  {connectors?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleTrigger} disabled={!selectedConnector || triggerMutation.isPending}>
                {triggerMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Start Backup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Snapshot ID</TableHead>
                <TableHead>Connector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading backups...</TableCell>
                </TableRow>
              ) : backups?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No backups recorded yet.</TableCell>
                </TableRow>
              ) : (
                backups?.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="font-mono text-xs">{backup.id.toString().padStart(6, '0')}</TableCell>
                    <TableCell className="font-medium">{backup.connectorName}</TableCell>
                    <TableCell>
                      <Badge variant={backup.status === 'completed' ? 'default' : backup.status === 'failed' ? 'destructive' : backup.status === 'running' ? 'secondary' : 'outline'}>
                        {backup.status === 'running' && <RefreshCw className="w-3 h-3 mr-1 animate-spin inline" />}
                        {backup.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{backup.totalRecords.toLocaleString()}</span>
                        {backup.failedRecords > 0 && <span className="text-xs text-destructive flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> {backup.failedRecords} failed</span>}
                      </div>
                    </TableCell>
                    <TableCell>{formatBytes(backup.totalSizeBytes)}</TableCell>
                    <TableCell>{format(new Date(backup.startedAt), 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/backups/${backup.id}`}>
                        <Button variant="ghost" size="sm">View Records</Button>
                      </Link>
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
