import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    api.get('/auth/me')
      .then(() => {
        navigate("/dashboard");
      })
      .catch(() => {
        // Not logged in, stay on auth page
      });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/login', { email, password });
      toast({ title: "Login successful!" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-school-navy/5 via-background to-school-orange/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-school-navy/10 bg-white">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="flex justify-center mb-1">
            <img
              src="/assets/school-logo.png"
              alt="FUN N LEARN SMART SCHOOL"
              className="h-20 w-auto object-contain drop-shadow-sm"
            />
          </div>
          <CardTitle className="text-xl font-extrabold text-school-navy tracking-tight uppercase">
            FUN N LEARN SMART SCHOOL
          </CardTitle>
          <CardDescription className="text-xs font-medium text-slate-500">
            School Fee Management & Administration Portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
