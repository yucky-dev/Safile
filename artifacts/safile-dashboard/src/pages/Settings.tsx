import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings2, Shield, Network, User, Loader2, RotateCw, Clock, Bell } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { StorageNodes } from "./StorageNodes";
import { format } from "date-fns";

const BASE = "/api";

async function getSettings() {
  const res = await fetch(`${BASE}/settings`);
  if (!res.ok) throw new Error("Failed to load settings");
  return res.json() as Promise<{
    connection: ConnectionSettings;
    encryption: EncryptionSettings;
    notifications: NotificationSettings;
    account: { name: string; institution: string; email: string };
  }>;
}

async function patchSettings(section: string, data: unknown) {
  const res = await fetch(`${BASE}/settings/${section}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

interface ConnectionSettings {
  backupIntervalHours: number;
  backupWindowStart: string;
  backupWindowEnd: string;
  backupEnabled: boolean;
  retentionDays: number;
}

interface EncryptionSettings {
  algorithm: string;
  autoRotateEnabled: boolean;
  rotationIntervalDays: number;
  notifyOnRotation: boolean;
  lastRotatedAt: string;
}

interface NotificationSettings {
  emailEnabled: boolean;
  notificationEmail: string;
  notifyOnBackupSuccess: boolean;
  notifyOnBackupFailure: boolean;
  notifyOnKeyRotation: boolean;
  notifyOnNodeOffline: boolean;
}

const connectionSchema = z.object({
  backupEnabled: z.boolean(),
  backupIntervalHours: z.coerce.number().min(1).max(168),
  backupWindowStart: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  backupWindowEnd: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  retentionDays: z.coerce.number().min(1).max(3650),
});

const encryptionSchema = z.object({
  autoRotateEnabled: z.boolean(),
  rotationIntervalDays: z.coerce.number().min(1).max(365),
  notifyOnRotation: z.boolean(),
});

const notificationsSchema = z.object({
  emailEnabled: z.boolean(),
  notificationEmail: z.string().email("Must be a valid email"),
  notifyOnBackupSuccess: z.boolean(),
  notifyOnBackupFailure: z.boolean(),
  notifyOnKeyRotation: z.boolean(),
  notifyOnNodeOffline: z.boolean(),
});

const accountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  institution: z.string().min(2, "Institution must be at least 2 characters"),
  email: z.string().email("Must be a valid email"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, { message: "Passwords do not match", path: ["confirmPassword"] });

function ConnectionTab({ defaults }: { defaults: ConnectionSettings }) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof connectionSchema>>({
    resolver: zodResolver(connectionSchema),
    defaultValues: defaults,
  });

  const onSubmit = async (values: z.infer<typeof connectionSchema>) => {
    try {
      await patchSettings("connection", values);
      toast({ title: "Connection settings saved" });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-4 h-4" /> Backup Schedule
        </CardTitle>
        <CardDescription>Configure when and how often backups run.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="backupEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <FormLabel className="text-sm font-medium">Automated Backups</FormLabel>
                    <p className="text-xs text-muted-foreground mt-0.5">Enable or disable the scheduled backup job.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="backupIntervalHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Backup Interval (hours)</FormLabel>
                    <FormControl><Input type="number" min={1} max={168} {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground">How often to run a backup cycle.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="retentionDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retention Period (days)</FormLabel>
                    <FormControl><Input type="number" min={1} max={3650} {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground">How long to keep backup records.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="backupWindowStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Window Start (HH:MM)</FormLabel>
                    <FormControl><Input placeholder="02:00" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground">Preferred start of the backup window (local time).</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="backupWindowEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Window End (HH:MM)</FormLabel>
                    <FormControl><Input placeholder="06:00" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground">Preferred end of the backup window (local time).</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Connection Settings
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function EncryptionTab({ defaults }: { defaults: EncryptionSettings }) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof encryptionSchema>>({
    resolver: zodResolver(encryptionSchema),
    defaultValues: {
      autoRotateEnabled: defaults.autoRotateEnabled,
      rotationIntervalDays: defaults.rotationIntervalDays,
      notifyOnRotation: defaults.notifyOnRotation,
    },
  });

  const nextRotation = () => {
    const last = new Date(defaults.lastRotatedAt);
    const interval = form.watch("rotationIntervalDays");
    const next = new Date(last.getTime() + interval * 24 * 60 * 60 * 1000);
    return format(next, "MMM d, yyyy");
  };

  const onSubmit = async (values: z.infer<typeof encryptionSchema>) => {
    try {
      await patchSettings("encryption", values);
      toast({ title: "Encryption settings saved" });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4" /> AES-256-GCM Encryption
          </CardTitle>
          <CardDescription>Configure key rotation schedules for data-at-rest encryption.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex-1 min-w-[180px]">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Algorithm</p>
              <p className="mt-1 text-sm font-semibold font-mono">{defaults.algorithm}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex-1 min-w-[180px]">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Last Rotated</p>
              <p className="mt-1 text-sm font-semibold">{format(new Date(defaults.lastRotatedAt), "MMM d, yyyy")}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex-1 min-w-[180px]">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Next Rotation</p>
              <p className="mt-1 text-sm font-semibold">
                {form.watch("autoRotateEnabled") ? nextRotation() : <Badge variant="outline">Disabled</Badge>}
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="autoRotateEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <FormLabel className="text-sm font-medium">Automatic Key Rotation</FormLabel>
                      <p className="text-xs text-muted-foreground mt-0.5">Automatically rotate encryption keys on a schedule.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rotationIntervalDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rotation Interval (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        disabled={!form.watch("autoRotateEnabled")}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">How frequently to rotate the active encryption key.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notifyOnRotation"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <FormLabel className="text-sm font-medium">Notify on Rotation</FormLabel>
                      <p className="text-xs text-muted-foreground mt-0.5">Send an alert when a key rotation occurs.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Encryption Settings
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsTab({ defaults }: { defaults: NotificationSettings }) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof notificationsSchema>>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: defaults,
  });

  const onSubmit = async (values: z.infer<typeof notificationsSchema>) => {
    try {
      await patchSettings("notifications", values);
      toast({ title: "Notification settings saved" });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-4 h-4" /> Notification Preferences
        </CardTitle>
        <CardDescription>Control which alerts are sent and where they are delivered.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="emailEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <FormLabel className="text-sm font-medium">Email Notifications</FormLabel>
                    <p className="text-xs text-muted-foreground mt-0.5">Send alerts via email.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notificationEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notification Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@hospital.local"
                      disabled={!form.watch("emailEnabled")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-3">
              <p className="text-sm font-medium">Alert Triggers</p>
              {([
                { name: "notifyOnBackupSuccess" as const, label: "Backup Succeeded", desc: "Alert when a backup completes successfully." },
                { name: "notifyOnBackupFailure" as const, label: "Backup Failed", desc: "Alert when a backup fails or errors." },
                { name: "notifyOnKeyRotation" as const, label: "Key Rotation", desc: "Alert when an encryption key is rotated." },
                { name: "notifyOnNodeOffline" as const, label: "Node Offline", desc: "Alert when a storage node goes offline." },
              ]).map(({ name, label, desc }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <FormLabel className="text-sm font-medium">{label}</FormLabel>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!form.watch("emailEnabled")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Notification Settings
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function AccountTab() {
  const { user, login } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: user?.name || "",
      institution: user?.institution || "",
      email: user?.email || "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof accountSchema>) => {
    try {
      const payload: Record<string, unknown> = {
        name: values.name,
        institution: values.institution,
        email: values.email,
      };
      if (values.newPassword) {
        payload.newPassword = values.newPassword;
        payload.confirmPassword = values.confirmPassword;
      }
      const updated = await patchSettings("account", payload) as { name: string; institution: string; email: string };
      login({ name: updated.name, institution: updated.institution, email: updated.email });
      form.reset({ name: updated.name, institution: updated.institution, email: updated.email, newPassword: "", confirmPassword: "" });
      toast({ title: "Account information updated" });
    } catch (err: any) {
      toast({ title: "Failed to save account", description: err.message, variant: "destructive" });
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-4 h-4" /> Account Details
        </CardTitle>
        <CardDescription>Update your profile information and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6 p-4 rounded-lg border border-border bg-muted/30">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-semibold">{user?.name || "System Admin"}</p>
            <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
            <Badge variant="outline" className="mt-1 text-xs">{user?.institution || "hospital.local"}</Badge>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Dr. Jane Smith" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution</FormLabel>
                    <FormControl><Input placeholder="Kenyatta National Hospital" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl><Input type="email" placeholder="admin@hospital.local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="border-t border-border pt-4 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Change Password (optional)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Account
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function Settings() {
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof getSettings>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings2 className="w-6 h-6" /> Settings
        </h1>
        <p className="text-muted-foreground text-sm">Configure backup schedules, encryption, storage, and your account.</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading settings…
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load settings: {error}
        </div>
      )}

      {!isLoading && settings && (
        <Tabs defaultValue="connection">
          <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="connection" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Settings2 className="w-3.5 h-3.5" /> Connection
            </TabsTrigger>
            <TabsTrigger value="encryption" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Shield className="w-3.5 h-3.5" /> Encryption
            </TabsTrigger>
            <TabsTrigger value="sia" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Network className="w-3.5 h-3.5" /> Sia Indexd
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Bell className="w-3.5 h-3.5" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <User className="w-3.5 h-3.5" /> Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="mt-4">
            <ConnectionTab defaults={settings.connection} />
          </TabsContent>

          <TabsContent value="encryption" className="mt-4">
            <EncryptionTab defaults={settings.encryption} />
          </TabsContent>

          <TabsContent value="sia" className="mt-4">
            <StorageNodes />
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <NotificationsTab defaults={settings.notifications} />
          </TabsContent>

          <TabsContent value="account" className="mt-4">
            <AccountTab />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
