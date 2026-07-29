import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, ArrowLeft, Shield, ShieldOff } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type ProfileRow = {
  id: string;
  email: string;
  created_at: string;
  isAdmin: boolean;
};

const Admins = () => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(user.id);

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);

    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      supabase.from("profiles").select("id, email, created_at").order("created_at", { ascending: true }),
      supabase.from("user_roles").select("user_id").eq("role", "admin"),
    ]);

    if (pErr || rErr) {
      toast({ title: "Failed to load users", description: pErr?.message ?? rErr?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const adminIds = new Set((roles ?? []).map((r) => r.user_id));
    setRows(
      (profiles ?? []).map((p) => ({
        id: p.id,
        email: p.email,
        created_at: p.created_at,
        isAdmin: adminIds.has(p.id),
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grantAdmin = async (userId: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) {
      toast({ title: "Failed to grant admin", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Admin access granted" });
    load();
  };

  const revokeAdmin = async (userId: string) => {
    if (userId === currentUserId) {
      toast({ title: "You cannot revoke your own admin access", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "admin");
    if (error) {
      toast({ title: "Failed to revoke admin", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Admin access revoked" });
    load();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Not authorized</CardTitle>
            <CardDescription>You need admin access to view this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Manage Admins</h1>
              <p className="text-sm text-muted-foreground">Grant or revoke admin access</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Only admins can access this app. Grant admin to any registered user, or revoke it to lock them out.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Signed up</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      No users yet.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.email}
                      {r.id === currentUserId && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {r.isAdmin ? (
                        <Badge>Admin</Badge>
                      ) : (
                        <Badge variant="secondary">No access</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.isAdmin ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => revokeAdmin(r.id)}
                          disabled={r.id === currentUserId}
                        >
                          <ShieldOff className="h-4 w-4 mr-2" /> Revoke
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => grantAdmin(r.id)}>
                          <Shield className="h-4 w-4 mr-2" /> Grant admin
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admins;
