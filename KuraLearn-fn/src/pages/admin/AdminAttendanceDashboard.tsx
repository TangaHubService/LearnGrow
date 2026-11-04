import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  TrendingUp,
  AlertCircle,
  Users,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { DetailCard, StatusBadge, ModernTable, CustomDropdown } from "../../components/ModernUi";
import { useAuth } from "../../contexts/AuthContext";
import { attendanceApi } from "../../services/attendanceApi";

const COLORS = ["#6d3eeb", "#10b981", "#f59e0b", "#ef4444"];

const AdminAttendanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("7d");

  const schoolId = (user as any)?.schoolId;

  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const data = await attendanceApi.getAnalytics(schoolId);
      setAnalytics(data.data || []);

      const alertsData = await attendanceApi.getAlerts(schoolId);
      setAlerts(alertsData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchData();
  }, [timeRange, fetchData]);

  const attendanceData = analytics.map((a) => ({
    name: new Date(a.date).toLocaleDateString(undefined, { weekday: "short" }),
    present: a.presentCount,
    absent: a.absentCount,
    late: a.lateCount,
    rate: a.attendanceRate,
  }));

  const summaryStats = {
    totalStudents: analytics.length > 0 ? analytics[analytics.length - 1].totalStudents : 0,
    avgRate:
      analytics.length > 0
        ? (analytics.reduce((sum, a) => sum + a.attendanceRate, 0) / analytics.length).toFixed(1)
        : 0,
    trend: "+2.4%",
    atRisk: alerts.length,
  };

  const pieData =
    analytics.length > 0
      ? [
          { name: "Present", value: analytics[analytics.length - 1].presentCount },
          { name: "Absent", value: analytics[analytics.length - 1].absentCount },
          { name: "Late", value: analytics[analytics.length - 1].lateCount },
          { name: "Excused", value: analytics[analytics.length - 1].excusedCount },
        ]
      : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 flex items-center gap-2">
            <LayoutDashboard className="text-[#6d3eeb]" /> Attendance Analytics
          </h1>
          <p className="text-slate-500">
            Intelligent insights and attendance patterns for {(user as any)?.schoolId}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-sm flex items-center gap-2 hover:bg-slate-50">
            <Download size={18} /> Export Report
          </button>
          <div className="w-44">
            <CustomDropdown
              options={[
                { value: "7d", label: "Last 7 Days" },
                { value: "30d", label: "Last 30 Days" },
                { value: "90d", label: "This Term" },
              ]}
              value={timeRange}
              onChange={(val) => setTimeRange(val)}
              clearable={false}
              className="!min-h-10"
            />
          </div>
        </div>
      </header>

      {/* Metric Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DetailCard className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Average Attendance</p>
              <h3 className="text-3xl font-bold text-slate-950 mt-1">{summaryStats.avgRate}%</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 grid place-items-center">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-700">
            <ArrowUpRight size={14} /> {summaryStats.trend}{" "}
            <span className="text-slate-500 font-normal">vs last week</span>
          </p>
        </DetailCard>

        <DetailCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Students</p>
              <h3 className="text-3xl font-bold text-slate-950 mt-1">
                {summaryStats.totalStudents}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 grid place-items-center">
              <Users size={24} />
            </div>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500">
            Total enrolled across all classes
          </p>
        </DetailCard>

        <DetailCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">At-Risk Students</p>
              <h3 className="text-3xl font-bold text-slate-950 mt-1">{summaryStats.atRisk}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-700 grid place-items-center">
              <AlertCircle size={24} />
            </div>
          </div>
          <p className="mt-4 flex items-center gap-1 text-xs font-bold text-rose-700">
            <ArrowDownRight size={14} /> 5 New{" "}
            <span className="text-slate-500 font-normal">this week</span>
          </p>
        </DetailCard>

        <DetailCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Marking Compliance</p>
              <h3 className="text-3xl font-bold text-slate-950 mt-1">92%</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-700 grid place-items-center">
              <CheckCircle size={24} />
            </div>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500">Teachers submitting on time</p>
        </DetailCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart */}
        <DetailCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-950">Attendance Trends</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <div className="h-2 w-2 rounded-full bg-[#6d3eeb]"></div> Present
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <div className="h-2 w-2 rounded-full bg-[#ef4444]"></div> Absent
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="present" fill="#6d3eeb" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DetailCard>

        {/* Distribution Chart */}
        <DetailCard>
          <h3 className="font-bold text-slate-950 mb-6">Today's Distribution</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLORS[i] }}
                  ></div>
                  <span className="text-slate-600">{d.name}</span>
                </div>
                <span className="font-bold text-slate-900">{d.value}</span>
              </div>
            ))}
          </div>
        </DetailCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gender Breakdown */}
        <DetailCard>
          <h3 className="font-bold text-slate-950 mb-6">Gender Breakdown</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={
                  analytics.length > 0 && analytics[analytics.length - 1].metadata?.genderStats
                    ? Object.entries(analytics[analytics.length - 1].metadata.genderStats).map(
                        ([gender, stats]: any) => ({
                          name: gender,
                          present: stats.present,
                          total: stats.total,
                          rate: (stats.present / stats.total) * 100,
                        }),
                      )
                    : []
                }
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  width={80}
                />
                <Tooltip />
                <Bar dataKey="rate" fill="#6d3eeb" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 italic">
            Showing attendance percentage by gender category.
          </p>
        </DetailCard>

        {/* Inclusive Education Breakdown */}
        <DetailCard>
          <h3 className="font-bold text-slate-950 mb-6">Inclusive Education (Disability Status)</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={
                  analytics.length > 0 && analytics[analytics.length - 1].metadata?.disabilityStats
                    ? Object.entries(analytics[analytics.length - 1].metadata.disabilityStats).map(
                        ([cat, stats]: any) => ({
                          name: cat,
                          present: stats.present,
                          total: stats.total,
                          rate: (stats.present / stats.total) * 100,
                        }),
                      )
                    : []
                }
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  width={80}
                />
                <Tooltip />
                <Bar dataKey="rate" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 italic">
            Monitoring attendance for students with identified support needs.
          </p>
        </DetailCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* At-Risk Students */}
        <DetailCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-950">At-Risk Students</h3>
            <button className="text-xs font-bold text-[#6d3eeb] hover:underline">View All</button>
          </div>
          <ModernTable
            data={alerts.slice(0, 5)}
            columns={[
              {
                header: "Student",
                accessor: (row: any) => (
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{row.student.user.name}</span>
                  </div>
                ),
              },
              {
                header: "Alert Type",
                accessor: (row: any) => (
                  <StatusBadge
                    value={row.type}
                    tone={row.severity === "HIGH" ? "error" : "warning"}
                  />
                ),
              },
              {
                header: "Risk Level",
                accessor: (row: any) => (
                  <span
                    className={`text-xs font-bold ${row.severity === "HIGH" ? "text-rose-700" : "text-amber-700"}`}
                  >
                    {row.severity}
                  </span>
                ),
              },
            ]}
          />
        </DetailCard>

        {/* Recent Analytics Logs */}
        <DetailCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-950">Daily Attendance Summary</h3>
            <button className="text-xs font-bold text-[#6d3eeb] hover:underline">
              View Full History
            </button>
          </div>
          <ModernTable
            data={analytics.slice(-5).reverse()}
            columns={[
              {
                header: "Date",
                accessor: (row: any) => new Date(row.date).toLocaleDateString(),
              },
              {
                header: "Present / Total",
                accessor: (row: any) => `${row.presentCount} / ${row.totalStudents}`,
              },
              {
                header: "Rate",
                accessor: (row: any) => (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${row.attendanceRate}%` }}
                      ></div>
                    </div>
                    <span className="font-bold">{row.attendanceRate.toFixed(1)}%</span>
                  </div>
                ),
              },
            ]}
          />
        </DetailCard>
      </div>
    </div>
  );
};

export default AdminAttendanceDashboard;
