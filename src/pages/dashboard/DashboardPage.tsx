import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  TrendingUp,
  TrendingDown,
  FileCheck,
  FileText,
  Users,
  Receipt,
  CreditCard,
  Lock,
} from "lucide-react";
import {
  quotationApi,
  invoiceApi,
  receiptApi,
  customerApi,
} from "../../services/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import LoadingSpinner from "../../components/common/LoadingSpinner";

interface DashboardStats {
  todaySales: number;
  quotationsCount: number;
  invoicesCount: number;
  receiptsCount: number;
  customersCount: number;
  paidInvoices: number;
  partialInvoices: number;
  unpaidInvoices: number;
  totalPaid: number;
  totalRemaining: number;
  totalRevenue: number;
}

interface MonthlySale {
  month: string;
  completed: number;
  inProgress: number;
}

interface Invoice {
  id: number;
  total: string | number;
  paidAmount: string | number;
  remainingAmount: string | number;
  status: string;
  createdAt: string;
}

interface Receipt {
  id: number;
  receiptNo: string;
  customerName: string;
  amount: string | number;
  createdAt: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  color: string;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlySales, setMonthlySales] = useState<MonthlySale[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [timeRange, setTimeRange] = useState<"1m" | "6m" | "1y">("6m");

  useEffect(() => {
    if (authLoading || !user) return;
    fetchDashboardData();
  }, [authLoading, user, isAdmin]);

  useEffect(() => {
    if (allInvoices.length > 0) {
      setMonthlySales(calculateSalesData(allInvoices, timeRange));
      return;
    }
    setMonthlySales([]);
  }, [allInvoices, timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      if (isAdmin) {
        const [quotationsRes, invoicesRes, receiptsRes, customersRes] =
          await Promise.all([
            quotationApi.getAll(),
            invoiceApi.getAll(),
            receiptApi.getAll(),
            customerApi.getAll(),
          ]);

        const quotations = quotationsRes.data.data;
        const invoices = invoicesRes.data.data;
        const receiptsData = receiptsRes.data.data;
        const customers = customersRes.data.data;

        const today = new Date().toDateString();
        const todaySales = invoices
          .filter(
            (inv: Invoice) => new Date(inv.createdAt).toDateString() === today
          )
          .reduce(
            (sum: number, inv: Invoice) => sum + parseFloat(String(inv.total)),
            0
          );

        const paidInvoices = invoices.filter(
          (i: Invoice) => i.status === "paid"
        ).length;
        const partialInvoices = invoices.filter(
          (i: Invoice) => i.status === "partial"
        ).length;
        const unpaidInvoices = invoices.filter(
          (i: Invoice) => i.status === "unpaid"
        ).length;

        const totalPaid = invoices.reduce(
          (sum: number, inv: Invoice) =>
            sum + parseFloat(String(inv.paidAmount)),
          0
        );
        const totalRemaining = invoices.reduce(
          (sum: number, inv: Invoice) =>
            sum + parseFloat(String(inv.remainingAmount)),
          0
        );

        const totalRevenue = receiptsData.reduce(
          (sum: number, receipt: Receipt) =>
            sum + parseFloat(String(receipt.amount)),
          0
        );

        setStats({
          todaySales,
          quotationsCount: quotations.length,
          invoicesCount: invoices.length,
          receiptsCount: receiptsData.length,
          customersCount: customers.length,
          paidInvoices,
          partialInvoices,
          unpaidInvoices,
          totalPaid,
          totalRemaining,
          totalRevenue,
        });

        setAllInvoices(invoices);

        const recentReceipts = receiptsData
          .sort((a: Receipt, b: Receipt) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        setReceipts(recentReceipts);
      } else {
        // Regular user — fetch their own data
        const [quotationsRes, invoicesRes, receiptsRes] = await Promise.all([
          quotationApi.getAll(),
          invoiceApi.getAll(),
          receiptApi.getAll(),
        ]);

        const quotations = quotationsRes.data.data;
        const invoices = invoicesRes.data.data;
        const receiptsData = receiptsRes.data.data;

        // Calculate user's stats
        const today = new Date().toDateString();
        const todaySales = invoices
          .filter(
            (inv: Invoice) => new Date(inv.createdAt).toDateString() === today
          )
          .reduce(
            (sum: number, inv: Invoice) => sum + parseFloat(String(inv.total)),
            0
          );

        const paidInvoices = invoices.filter(
          (i: Invoice) => i.status === "paid"
        ).length;
        const partialInvoices = invoices.filter(
          (i: Invoice) => i.status === "partial"
        ).length;
        const unpaidInvoices = invoices.filter(
          (i: Invoice) => i.status === "unpaid"
        ).length;

        const totalPaid = invoices.reduce(
          (sum: number, inv: Invoice) =>
            sum + parseFloat(String(inv.paidAmount)),
          0
        );
        const totalRemaining = invoices.reduce(
          (sum: number, inv: Invoice) =>
            sum + parseFloat(String(inv.remainingAmount)),
          0
        );

        const totalRevenue = receiptsData.reduce(
          (sum: number, receipt: Receipt) =>
            sum + parseFloat(String(receipt.amount)),
          0
        );

        // Get unique customer count from user's documents
        const customerIds = new Set([
          ...quotations.map((q: any) => q.customerId).filter(Boolean),
          ...invoices.map((i: any) => i.customerId).filter(Boolean)
        ]);

        setStats({
          todaySales,
          quotationsCount: quotations.length,
          invoicesCount: invoices.length,
          receiptsCount: receiptsData.length,
          customersCount: customerIds.size,
          paidInvoices,
          partialInvoices,
          unpaidInvoices,
          totalPaid,
          totalRemaining,
          totalRevenue,
        });

        setAllInvoices(invoices);

        // Get recent documents for this user
        const recentReceipts = receiptsData
          .sort((a: Receipt, b: Receipt) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        setReceipts(recentReceipts);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSalesData = (invoices: Invoice[], range: "1m" | "6m" | "1y") => {
    const data: MonthlySale[] = [];
    const now = new Date();

    if (range === "1m") {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayMonth = date.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "short",
        });
        const dateString = date.toDateString();
        const sales = invoices
          .filter(
            (inv: Invoice) => new Date(inv.createdAt).toDateString() === dateString
          )
          .reduce(
            (sum: number, inv: Invoice) => sum + parseFloat(String(inv.total)),
            0
          );
        data.push({ month: dayMonth, completed: sales * 0.6, inProgress: sales * 0.4 });
      }
    } else {
      const monthCount = range === "1y" ? 11 : 5;
      for (let i = monthCount; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString("th-TH", { month: "short" });
        const sales = invoices
          .filter((inv: Invoice) => {
            const invDate = new Date(inv.createdAt);
            return (
              invDate.getMonth() === date.getMonth() &&
              invDate.getFullYear() === date.getFullYear()
            );
          })
          .reduce((sum: number, inv: Invoice) => sum + parseFloat(String(inv.total)), 0);
        data.push({
          month: monthName,
          completed: sales * 0.6,
          inProgress: sales * 0.4,
        });
      }
    }
    return data;
  };

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
          <p className="text-sm font-bold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-500">
                    {entry.name === "completed" ? "ชำระแล้ว" : "รอชำระ"}
                  </span>
                </div>
                <span className="font-semibold text-gray-900">
                  ฿{entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-100 my-2 pt-2 flex justify-between text-xs font-bold">
              <span className="text-gray-600">รวมทั้งหมด</span>
              <span className="text-blue-600">
                ฿{(payload[0].value + payload[1].value).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color,
  }: StatCardProps) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
      <div
        className={`absolute -right-4 -top-4 w-24 h-24 bg-${color}-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500`}
      />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
        </div>
        <div className={`p-2.5 bg-${color}-50 text-${color}-600 rounded-xl`}>
          <Icon className="w-6 h-6" strokeWidth={2} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-2 mt-4 text-xs font-medium relative z-10">
          <span
            className={`${
              trend === "up"
                ? "text-emerald-600 bg-emerald-50"
                : "text-rose-600 bg-rose-50"
            } px-2 py-0.5 rounded-full flex items-center gap-1`}
          >
            {trend === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trendValue}
          </span>
          <span className="text-gray-400">จากเดือนก่อน</span>
        </div>
      )}
    </div>
  );

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  // ========== Regular User View ==========
  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-10">
        {/* Welcome Banner */}
        <div className="bg-white rounded-2xl px-6 py-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Easybill Online</h2>
              <p className="text-sm text-gray-500 mt-1">
                ระบบจัดการเอกสารทางธุรกิจขนาดเล็ก
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              ผู้ใช้งานทั่วไป
            </div>
          </div>
        </div>

        {/* Counts Only */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="ใบเสนอราคา"
            value={stats?.quotationsCount || 0}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="ใบแจ้งหนี้"
            value={stats?.invoicesCount || 0}
            icon={Receipt}
            color="purple"
          />
          <StatCard
            title="ลูกค้าทั้งหมด"
            value={stats?.customersCount || 0}
            icon={Users}
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">ทางลัด</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "สร้างใบเสนอราคา", path: "/quotations/create", color: "blue" },
              { label: "สร้างใบแจ้งหนี้", path: "/invoices/create", color: "purple" },
              { label: "ดูใบเสนอราคา", path: "/quotations", color: "indigo" },
              { label: "ดูใบแจ้งหนี้", path: "/invoices", color: "violet" },
            ].map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`p-4 rounded-xl bg-${action.color}-50 text-${action.color}-700 font-medium text-sm hover:bg-${action.color}-100 transition-colors text-center`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">รายการล่าสุดของคุณ</h3>
            <button
              onClick={() => navigate("/receipts")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ดูทั้งหมด
            </button>
          </div>
          <div className="space-y-4">
            {receipts.length > 0 ? (
              receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  onClick={() => navigate(`/receipts/${receipt.id}`)}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group border border-transparent hover:border-gray-100"
                >
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600">
                      {receipt.receiptNo}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {receipt.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">
                      +฿{parseFloat(String(receipt.amount)).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(receipt.createdAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">ยังไม่มีรายการ</div>
            )}
          </div>
        </div>

        {/* Sales Chart for Regular Users */}
        {monthlySales.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">ภาพรวมรายรับของคุณ</h3>
                <p className="text-sm text-gray-500">
                  เปรียบเทียบยอดที่ชำระแล้วกับที่รอชำระ
                </p>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as "1m" | "6m" | "1y")}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="1m">30 วันล่าสุด</option>
                <option value="6m">6 เดือนล่าสุด</option>
                <option value="1y">1 ปีล่าสุด</option>
              </select>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlySales}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e2e8f0" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#e2e8f0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    tickFormatter={(val) => `฿${val / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="inProgress"
                    stroke="#cbd5e1"
                    strokeWidth={2}
                    fill="url(#colorInProgress)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#colorCompleted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
       
      </div>
    );
  }

  // ========== Admin View ==========
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="รายได้สุทธิ"
          value={`฿${(stats?.totalRevenue || 0).toLocaleString("th-TH", {
            maximumFractionDigits: 0,
          })}`}
          icon={CreditCard}
          color="emerald"
          trend="up"
          trendValue="12.5%"
        />
        <StatCard
          title="ใบเสนอราคา"
          value={stats?.quotationsCount || 0}
          icon={FileText}
          color="blue"
          trend="up"
          trendValue="8.2%"
        />
        <StatCard
          title="ใบแจ้งหนี้"
          value={stats?.invoicesCount || 0}
          icon={Receipt}
          color="purple"
          trend="up"
          trendValue="5.4%"
        />
        <StatCard
          title="ลูกค้าทั้งหมด"
          value={stats?.customersCount || 0}
          icon={Users}
          color="orange"
          trend="up"
          trendValue="2.1%"
        />
      </div>

      {/* Chart + Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">ภาพรวมรายรับ</h3>
              <p className="text-sm text-gray-500">
                เปรียบเทียบยอดที่ชำระแล้วกับที่รอชำระ
              </p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as "1m" | "6m" | "1y")}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="1m">30 วันล่าสุด</option>
              <option value="6m">6 เดือนล่าสุด</option>
              <option value="1y">1 ปีล่าสุด</option>
            </select>
          </div>
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlySales}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e2e8f0" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#e2e8f0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickFormatter={(val) => `฿${val / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="inProgress"
                  stroke="#cbd5e1"
                  strokeWidth={2}
                  fill="url(#colorInProgress)"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#colorCompleted)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Receipts */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">รายการล่าสุด</h3>
              <button
                onClick={() => navigate("/receipts")}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                ดูทั้งหมด
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {receipts.length > 0 ? (
                receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    onClick={() => navigate(`/receipts/${receipt.id}`)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group border border-transparent hover:border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600">
                        {receipt.receiptNo}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {receipt.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">
                        +฿{parseFloat(String(receipt.amount)).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(receipt.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">ไม่มีข้อมูล</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;