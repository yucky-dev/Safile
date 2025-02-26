import { useListKeys, useCreateKey, useRotateKey, getListKeysQueryKey, useListEhrConnectors } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Key, Plus, RefreshCw, Loader2, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function Keys() {
  const { data: keys, isLoading } = useListKeys();
  const { data: connectors } = useListEhrConnectors();
  const createMutation = useCreateKey();
  const rotateMutation = useRotateKey();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCreate = () => {
    createMutation.mutate(
      { data: { algorithm: "AES-256-GCM", connectorId: selectedConnector === "all" ? null : parseInt(selectedConnector) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListKeysQueryKey() });
          setIsAddOpen(false);
          toast({ title: "Encryption key generated" });
        },
        onError: (err: any) => {
          toast({ title: "Failed to generate key", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const handleRotate = (id: number) => {
    if (confirm("Are you sure you want to rotate this key? Existing backups will remain accessible, but new backups will use the new key material.")) {
      rotateMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListKeysQueryKey() });
            toast({ title: "Key rotated successfully" });
          },
          onError: (err: any) => {
            toast({ title: "Failed to rotate key", description: err.message, variant: "destructive" });
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Encryption Keys</h1>
          <p className="text-muted-foreground text-sm">Manage client-side AES-256-GCM keys for zero-knowledge backups.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Generate Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Encryption Key</DialogTitle>
              <DialogDescription>Create a new cryptographic key for encrypting backups.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Scope / Connector Assignment</label>
                <Select value={selectedConnector} onValueChange={setSelectedConnector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Global (All Connectors)</SelectItem>
                    {connectors?.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">Global keys encrypt all backups. Connector-specific keys isolate encryption to a single data source.</p>
              </div>
              <div className="p-3 bg-muted rounded border border-border flex items-center">
                <Shield className="w-5 h-5 text-primary mr-3" />
                <div className="text-sm">
                  <p className="font-medium">AES-256-GCM</p>
                  <p className="text-xs text-muted-foreground">Military-grade authenticated encryption</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate Secure Key
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
                <TableHead>Key ID</TableHead>
                <TableHead>Algorithm</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Rotated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading keys...</TableCell>
                </TableRow>
              ) : keys?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No encryption keys found.</TableCell>
                </TableRow>
              ) : (
                keys?.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-mono text-xs flex items-center">
                      <Key className="w-3 h-3 mr-2 text-muted-foreground" />
                      {key.keyId}
                    </TableCell>
                    <TableCell>{key.algorithm}</TableCell>
                    <TableCell>
                      {key.connectorId ? (
                        <Badge variant="outline" className="font-normal text-xs border-primary/30 text-primary">Connector #{key.connectorId}</Badge>
                      ) : (
                        <Badge variant="outline" className="font-normal text-xs">Global</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.status === 'active' ? 'default' : key.status === 'rotated' ? 'secondary' : 'destructive'}>
                        {key.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(key.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{key.rotatedAt ? format(new Date(key.rotatedAt), 'MMM d, yyyy') : '—'}</TableCell>
                    <TableCell className="text-right">
                      {key.status === 'active' && (
                        <Button variant="outline" size="sm" onClick={() => handleRotate(key.id)} disabled={rotateMutation.isPending && rotateMutation.variables?.id === key.id}>
                          {rotateMutation.isPending && rotateMutation.variables?.id === key.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                          Rotate
                        </Button>
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
