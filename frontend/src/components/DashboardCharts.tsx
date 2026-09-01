import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from "recharts";

// School Branding Palette: Navy (#2F3363), Orange (#DD8D33), Blue (#189BC7), Green (#61A964)
const COLORS = ['#2F3363', '#DD8D33', '#189BC7', '#61A964', '#64748B'];

export const DashboardCharts = ({ refreshKey }: { refreshKey: number }) => {
  const [loading, setLoading] = useState(true);
  const [chartsData, setChartsData] = useState<any>(null);

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const { data } = await api.get('/dashboard/charts');
        setChartsData(data);
      } catch (error) {
        console.error("Failed to fetch charts", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCharts();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card className="h-[300px] flex items-center justify-center text-muted-foreground shadow-md">Loading chart...</Card>
        <Card className="h-[300px] flex items-center justify-center text-muted-foreground shadow-md">Loading chart...</Card>
      </div>
    );
  }

  if (!chartsData) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
      {/* Monthly Collection Bar Chart */}
      <Card className="col-span-1 md:col-span-2 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-school-navy">Monthly Fee Collection ({new Date().getFullYear()})</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartsData.monthlyCollection} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis tickFormatter={(value) => `₹${value}`} tickLine={false} />
              <RechartsTooltip cursor={{ fill: 'rgba(221, 141, 51, 0.08)' }} formatter={(value) => `₹${value}`} />
              <Bar dataKey="amount" fill="#2F3363" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Fee Category Distribution */}
      <Card className="col-span-1 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Fee Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartsData.feeDistributionData || chartsData.feeStatusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {(chartsData.feeDistributionData || chartsData.feeStatusData).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(val) => typeof val === 'number' ? `₹${val.toLocaleString()}` : val} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
