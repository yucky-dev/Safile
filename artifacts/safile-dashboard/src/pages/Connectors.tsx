import { useListEhrConnectors, useCreateEhrConnector, useUpdateEhrConnector, useDeleteEhrConnector, useTestEhrConnector, getListEhrConnectorsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Activity, Plus, Settings2, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ehrSystem: z.string().min(1, "System type is required"),
  apiEndpoint: z.string().url("Must be a valid URL"),
  apiKey: z.string().min(1, "API Key is required"),
  syncIntervalHours: z.coerce.number().min(1).max(24),
});

export function Connectors() {
  const { data: connectors, isLoading } = useListEhrConnectors();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateEhrConnector();
  const deleteMutation = useDeleteEhrConnector();
  const testMutation = useTestEhrConnector();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      ehrSystem: "OpenMRS",
      apiEndpoint: "",
      apiKey: "",
      syncIntervalHours: 24,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEhrConnectorsQueryKey() });
          setIsAddOpen(false);
          form.reset();
          toast({ title: "Connector created successfully" });
        },
        onError: (err: any) => {
          toast({ title: "Failed to create connector", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleTest = (id: number) => {
    testMutation.mutate(
      { id },
      {
        onSuccess: (res) => {
          toast({ 
            title: res.success ? "Connection Successful" : "Connection Failed", 
            description: res.message,
            variant: res.success ? "default" : "destructive"
          });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this connector?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListEhrConnectorsQueryKey() });
            toast({ title: "Connector deleted" });
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">EHR Connectors</h1>
          <p className="text-muted-foreground text-sm">Manage connections to hospital Electronic Health Record systems.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Connector</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add EHR Connector</DialogTitle>
              <DialogDescription>Configure a new connection to an EHR system.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Connector Name</FormLabel>
                      <FormControl><Input placeholder="Main Hospital OpenMRS" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ehrSystem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>EHR System</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a system" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="OpenMRS">OpenMRS</SelectItem>
                          <SelectItem value="Bahmni">Bahmni</SelectItem>
                          <SelectItem value="DHIS2">DHIS2</SelectItem>
                          <SelectItem value="Epic">Epic</SelectItem>
                          <SelectItem value="Custom">Custom / Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apiEndpoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Endpoint URL</FormLabel>
                      <FormControl><Input placeholder="https://api.hospital.local/openmrs" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key / Token</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="syncIntervalHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sync Interval (Hours)</FormLabel>
                      <FormControl><Input type="number" min={1} max={24} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Connector
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
                <TableHead>Name</TableHead>
                <TableHead>System</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading connectors...</TableCell>
                </TableRow>
              ) : connectors?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No connectors configured.</TableCell>
                </TableRow>
              ) : (
                connectors?.map((conn) => (
                  <TableRow key={conn.id}>
                    <TableCell className="font-medium">{conn.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{conn.ehrSystem}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={conn.status === 'active' ? 'default' : conn.status === 'error' ? 'destructive' : 'secondary'}>
                        {conn.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{conn.lastSyncAt ? format(new Date(conn.lastSyncAt), 'MMM d, HH:mm') : 'Never'}</TableCell>
                    <TableCell>{conn.syncIntervalHours}h</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleTest(conn.id)} disabled={testMutation.isPending && testMutation.variables?.id === conn.id}>
                        {testMutation.isPending && testMutation.variables?.id === conn.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                        <span className="sr-only">Test</span>
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(conn.id)} disabled={deleteMutation.isPending && deleteMutation.variables?.id === conn.id}>
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete</span>
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
