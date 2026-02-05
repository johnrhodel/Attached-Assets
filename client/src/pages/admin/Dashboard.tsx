import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Box, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useI18n } from "@/lib/i18n/context";

const data = [
  { name: 'Jan', mints: 400 },
  { name: 'Feb', mints: 300 },
  { name: 'Mar', mints: 200 },
  { name: 'Apr', mints: 278 },
  { name: 'May', mints: 189 },
  { name: 'Jun', mints: 239 },
];

export default function Dashboard() {
  const { t } = useI18n();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground">{t.nav.dashboard}</h2>
          <p className="text-muted-foreground mt-2">{t.admin.welcome}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: t.admin.activeDrops, value: "12", icon: Box, color: "text-blue-500" },
            { title: t.admin.recentMints, value: "2,350", icon: Activity, color: "text-green-500" },
            { title: "Users", value: "12,234", icon: Users, color: "text-purple-500" },
            { title: "Growth", value: "+24%", icon: TrendingUp, color: "text-orange-500" },
          ].map((stat, i) => (
            <Card key={i} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle>{t.admin.recentMints}</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar 
                      dataKey="mints" 
                      fill="currentColor" 
                      radius={[4, 4, 0, 0]} 
                      className="fill-primary" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3 shadow-sm">
            <CardHeader>
              <CardTitle>{t.admin.recentMints}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{t.claim.mintSuccess}</p>
                      <p className="text-xs text-muted-foreground">
                        0x1234...5678
                      </p>
                    </div>
                    <div className="ml-auto font-medium text-xs text-muted-foreground">+1</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
