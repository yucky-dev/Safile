import { useListIndexdNodes, useCreateIndexdNode, useDeleteIndexdNode, useGetIndexdNodeStatus, getListIndexdNodesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { HardDrive, Plus, Trash2, Activity, Loader2, Network, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  nodeUrl: z.string().url("Must be a valid URL"),
  apiPassword: z.string().min(1, "API Password is required"),
  redundancy: z.coerce.number().min(1).max(10),
});

function NodeStatus({ id, status }: { id: number, status: string }) {
  const { data: health, isLoading } = useGetIndexdNodeStatus(id, { query: { enabled: true, refetchInterval: 30000 } });
  
  if (isLoading) return <Badge variant="outline" className="text-muted-foreground"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Checking...</Badge>;
  
  if (health?.healthy) {
    return <Badge variant="default" className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Online {health.version ? `(v${health.version})` : ''}</Badge>;
  }
  
  return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Offline</Badge>;
}

export function StorageNodes() {
  const { data: nodes, isLoading } = useListIndexdNodes();
  const createMutation = useCreateIndexdNode();
  const deleteMutation = useDeleteIndexdNode();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nodeUrl: "http://localhost:9900",
      apiPassword: "",
      redundancy: 3,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListIndexdNodesQueryKey() });
          setIsAddOpen(false);
          form.reset();
          toast({ title: "Indexd node added successfully" });
        },
        onError: (err: any) => {
          toast({ title: "Failed to add node", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this storage node? It will no longer be used for new backups.")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListIndexdNodesQueryKey() });
            toast({ title: "Node removed" });
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sia Storage Nodes</h1>
          <p className="text-muted-foreground text-sm">Configure indexd gateways for decentralized data redundancy.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Node</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Indexd Node</DialogTitle>
              <DialogDescription>Connect a new Sia storage gateway to the network.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nodeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Node URL</FormLabel>
                      <FormControl><Input placeholder="http://192.168.1.100:9900" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apiPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Password</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="redundancy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Replication Factor</FormLabel>
                      <FormControl><Input type="number" min={1} max={10} {...field} /></FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Number of distinct Sia hosts to store each chunk on.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Connect Node
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Node Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Redundancy</TableHead>
                <TableHead>Added Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading storage nodes...</TableCell>
                </TableRow>
              ) : nodes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No indexd nodes configured.</TableCell>
                </TableRow>
              ) : (
                nodes?.map((node) => (
                  <TableRow key={node.id}>
                    <TableCell className="font-medium flex items-center">
                      <Network className="w-4 h-4 mr-2 text-muted-foreground" />
                      {node.nodeUrl}
                    </TableCell>
                    <TableCell>
                      <NodeStatus id={node.id} status={node.status} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{node.redundancy}x</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(node.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(node.id)} disabled={deleteMutation.isPending && deleteMutation.variables?.id === node.id}>
                        {deleteMutation.isPending && deleteMutation.variables?.id === node.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        <span className="sr-only">Remove</span>
                      </Button>
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
