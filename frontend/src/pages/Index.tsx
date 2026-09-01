import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Receipt, Users, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-lg">
                <GraduationCap className="h-16 w-16 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Preschool Fee Manager
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline your preschool's fee collection with automated receipt generation and student management
            </p>
            <Button size="lg" onClick={() => navigate("/auth")} className="mt-4">
              <Lock className="h-5 w-5 mr-2" />
              Admin Login
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Student Database</CardTitle>
                <CardDescription>
                  Manage all enrolled students with complete details including name, parent information, class, and contact numbers
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                  <Receipt className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Auto Receipts</CardTitle>
                <CardDescription>
                  Generate professional fee receipts automatically with payment details, transaction IDs, and monthly or annual fee tracking
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                  <Lock className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Secure Access</CardTitle>
                <CardDescription>
                  Admin-only access ensures your student data and payment records are protected with secure authentication
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 shadow-lg">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-semibold mb-4 text-center">Key Features</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <div>
                    <p className="font-medium">Complete Student Records</p>
                    <p className="text-sm text-muted-foreground">Store and search student information efficiently</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-secondary/10 rounded-full p-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  </div>
                  <div>
                    <p className="font-medium">Monthly & Annual Fees</p>
                    <p className="text-sm text-muted-foreground">Track different fee types separately</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-accent/10 rounded-full p-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                  </div>
                  <div>
                    <p className="font-medium">Payment History</p>
                    <p className="text-sm text-muted-foreground">View complete payment records per student</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <div>
                    <p className="font-medium">Printable Receipts</p>
                    <p className="text-sm text-muted-foreground">Professional receipts ready to print</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
