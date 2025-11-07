import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  FileText,
  Award,
  Package,
} from "lucide-react";
import {
  quotationApi,
  invoiceApi,
  customerApi,
  productApi,
} from "../../services/api";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { Calendar as CalendarIcon, Clock, MapPin, AlertCircle } from 'lucide-react';
import { appointmentApi } from "../../services/api";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todaySales: 0,
    quotationsCount: 0,
    invoicesCount: 0,
    customersCount: 0,
    productsCount: 0,
    pendingQuotations: 0,
    paidInvoices: 0,
    partialInvoices: 0,
    unpaidInvoices: 0,
    totalPaid: 0,
    totalRemaining: 0,
  });

  const [recentQuotations, setRecentQuotations] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [invoiceStatusData, setInvoiceStatusData] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // ดึงข้อมูลทั้งหมดพร้อมกัน (เพิ่ม appointmentApi)
      const [quotationsRes, invoicesRes, customersRes, productsRes, appointmentsRes] =
        await Promise.all([
          quotationApi.getAll(),
          invoiceApi.getAll(),
          customerApi.getAll(),
          productApi.getAll(),
          appointmentApi.getAll({ status: 'pending' }) // เพิ่มบรรทัดนี้
        ]);

      const quotations = quotationsRes.data.data;
      const invoices = invoicesRes.data.data;
      const customers = customersRes.data.data;
      const products = productsRes.data.data;

      // คำนวณยอดขายวันนี้
      const today = new Date().toDateString();
      const todaySales = invoices
        .filter((inv: any) => new Date(inv.createdAt).toDateString() === today)
        .reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0);

      // นับจำนวนใบเสนอราคาแต่ละสถานะ
      const pendingQuotations = quotations.filter(
        (q: any) => q.status === "draft" || q.status === "sent"
      ).length;

      // นับจำนวนใบแจ้งหนี้แต่ละสถานะ
      const paidInvoices = invoices.filter(
        (i: any) => i.status === "paid"
      ).length;
      const partialInvoices = invoices.filter(
        (i: any) => i.status === "partial"
      ).length;
      const unpaidInvoices = invoices.filter(
        (i: any) => i.status === "unpaid"
      ).length;

      // คำนวณยอดรับแล้วและยอดคงเหลือ
      const totalPaid = invoices.reduce(
        (sum: number, inv: any) => sum + parseFloat(inv.paidAmount),
        0
      );
      const totalRemaining = invoices.reduce(
        (sum: number, inv: any) => sum + parseFloat(inv.remainingAmount),
        0
      );

      setStats({
        todaySales,
        quotationsCount: quotations.length,
        invoicesCount: invoices.length,
        customersCount: customers.length,
        productsCount: products.length,
        pendingQuotations,
        paidInvoices,
        partialInvoices,
        unpaidInvoices,
        totalPaid,
        totalRemaining,
      });

      // ใบเสนอราคาล่าสุด 3 รายการ
      setRecentQuotations(quotations.slice(0, 3));

      // ใบแจ้งหนี้ล่าสุด 3 รายการ
      setRecentInvoices(invoices.slice(0, 3));

      // === ข้อมูลสำหรับกราฟ ===

      // 1. ยอดขายรายเดือน (6 เดือนล่าสุด)
      const monthlyData = calculateMonthlySales(invoices);
      setMonthlySales(monthlyData);

      // 2. สถานะใบแจ้งหนี้สำหรับ Pie Chart
      const statusData = [
        { name: "รอชำระ", value: unpaidInvoices, color: "#EAB308" },
        { name: "ชำระบางส่วน", value: partialInvoices, color: "#3B82F6" },
        { name: "ชำระแล้ว", value: paidInvoices, color: "#10B981" },
      ];
      setInvoiceStatusData(statusData);

      // 3. Top 5 ลูกค้า (ตามยอดซื้อ)
      const customerSales = calculateTopCustomers(invoices, customers);
      setTopCustomers(customerSales);

      // 4. Top 5 สินค้า (ตามจำนวนขาย)
      const productSales = calculateTopProducts(invoices);
      setTopProducts(productSales);

      // === เพิ่มส่วนนัดหมาย ===
      // กรองนัดหมายที่จะถึงใน 7 วันข้างหน้า
      const todayDate = new Date();
      const nextWeek = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      const upcoming = appointmentsRes.data.data
        .filter((apt: any) => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= todayDate && aptDate <= nextWeek;
        })
        .sort((a: any, b: any) =>
          new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
        )
        .slice(0, 5); // เอาแค่ 5 รายการแรก

      setUpcomingAppointments(upcoming);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันคำนวณยอดขายรายเดือน
  const calculateMonthlySales = (invoices: any[]) => {
    const months = [];
    const now = new Date();

    // สร้างข้อมูล 6 เดือนย้อนหลัง
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("th-TH", { month: "short" });
      const year = date.getFullYear();

      // คำนวณยอดขายของเดือนนั้น
      const sales = invoices
        .filter((inv: any) => {
          const invDate = new Date(inv.createdAt);
          return (
            invDate.getMonth() === date.getMonth() &&
            invDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0);

      months.push({
        month: monthName,
        sales: sales,
        count: invoices.filter((inv: any) => {
          const invDate = new Date(inv.createdAt);
          return (
            invDate.getMonth() === date.getMonth() &&
            invDate.getFullYear() === date.getFullYear()
          );
        }).length,
      });
    }

    return months;
  };

  // ฟังก์ชันคำนวณ Top Customers
  const calculateTopCustomers = (invoices: any[], customers: any[]) => {
    const customerMap = new Map();

    invoices.forEach((inv: any) => {
      const customerId = inv.customerId || inv.customerName;
      const amount = parseFloat(inv.total);

      if (customerMap.has(customerId)) {
        customerMap.set(customerId, {
          ...customerMap.get(customerId),
          total: customerMap.get(customerId).total + amount,
          count: customerMap.get(customerId).count + 1,
        });
      } else {
        customerMap.set(customerId, {
          id: customerId,
          name: inv.customerName,
          total: amount,
          count: 1,
        });
      }
    });

    // แปลงเป็น array และเรียงลำดับ
    return Array.from(customerMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  // ฟังก์ชันคำนวณ Top Products
  const calculateTopProducts = (invoices: any[]) => {
    const productMap = new Map();

    invoices.forEach((inv: any) => {
      inv.items?.forEach((item: any) => {
        const productId = item.productId || item.productName;
        const quantity = item.quantity;
        const amount = parseFloat(item.total);

        if (productMap.has(productId)) {
          productMap.set(productId, {
            ...productMap.get(productId),
            quantity: productMap.get(productId).quantity + quantity,
            total: productMap.get(productId).total + amount,
          });
        } else {
          productMap.set(productId, {
            id: productId,
            name: item.productName,
            quantity: quantity,
            total: amount,
          });
        }
      });
    });

    // แปลงเป็น array และเรียงลำดับตามจำนวน
    return Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: string, type: "quotation" | "invoice") => {
    if (type === "quotation") {
      const config: any = {
        draft: { label: "ร่าง", color: "bg-gray-100 text-gray-800" },
        sent: { label: "ส่งแล้ว", color: "bg-blue-100 text-blue-800" },
        accepted: { label: "อนุมัติ", color: "bg-green-100 text-green-800" },
        rejected: { label: "ปฏิเสธ", color: "bg-red-100 text-red-800" },
        converted: {
          label: "แปลงแล้ว",
          color: "bg-purple-100 text-purple-800",
        },
      };
      const s = config[status] || config.draft;
      return (
        <span className={`text-xs px-2 py-1 rounded ${s.color}`}>
          {s.label}
        </span>
      );
    } else {
      const config: any = {
        unpaid: { label: "รอชำระ", color: "bg-yellow-100 text-yellow-800" },
        partial: { label: "ชำระบางส่วน", color: "bg-blue-100 text-blue-800" },
        paid: { label: "ชำระแล้ว", color: "bg-green-100 text-green-800" },
        overdue: { label: "เกินกำหนด", color: "bg-red-100 text-red-800" },
      };
      const s = config[status] || config.unpaid;
      return (
        <span className={`text-xs px-2 py-1 rounded ${s.color}`}>
          {s.label}
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  const statsCards = [
    {
      name: "ยอดขายวันนี้",
      value: `฿${stats.todaySales.toLocaleString()}`,
      change: `+${stats.paidInvoices} ใบ`,
      icon: TrendingUp,
      color: "blue",
    },
    {
      name: "ใบเสนอราคา",
      value: stats.quotationsCount.toString(),
      change: `${stats.pendingQuotations} รอดำเนินการ`,
      icon: FileText,
      color: "purple",
    },
    {
      name: "ใบแจ้งหนี้",
      value: stats.invoicesCount.toString(),
      change: `${stats.paidInvoices} ชำระแล้ว`,
      icon: ShoppingCart,
      color: "green",
    },
    {
      name: "ลูกค้าทั้งหมด",
      value: stats.customersCount.toString(),
      change: `${stats.productsCount} สินค้า`,
      icon: Users,
      color: "orange",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          ยินดีต้อนรับสู่ระบบจัดการเอกสารธุรกิจ
        </h1>
        <p className="text-blue-100">
          จัดการใบเสนอราคาและใบแจ้งหนี้ได้อย่างง่ายดาย
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: "bg-blue-100 text-blue-600",
            purple: "bg-purple-100 text-purple-600",
            green: "bg-green-100 text-green-600",
            orange: "bg-orange-100 text-orange-600",
          }[stat.color];

          return (
            <div
              key={stat.name}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm text-green-600 font-medium">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </h3>
              <p className="text-sm text-gray-600">{stat.name}</p>
            </div>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">ยอดรับแล้วทั้งหมด</div>
          <div className="text-3xl font-bold text-green-600">
            ฿{stats.totalPaid.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">ยอดคงเหลือ</div>
          <div className="text-3xl font-bold text-red-600">
            ฿{stats.totalRemaining.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">สถานะใบแจ้งหนี้</div>
          <div className="flex gap-2 mt-2">
            <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              รอชำระ {stats.unpaidInvoices}
            </span>
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              บางส่วน {stats.partialInvoices}
            </span>
            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
              แล้ว {stats.paidInvoices}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ยอดขายรายเดือน (6 เดือนล่าสุด)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                stroke="#9CA3AF"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#9CA3AF"
                style={{ fontSize: "12px" }}
                tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: any) => [
                  `฿${value.toLocaleString()}`,
                  "ยอดขาย",
                ]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "14px" }}
                formatter={(value) => (value === "sales" ? "ยอดขาย" : value)}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: "#3B82F6", r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice Status Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            สถานะใบแจ้งหนี้
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={invoiceStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) =>
                  `${entry.name} ${(entry.percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {invoiceStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [`${value} ใบ`, "จำนวน"]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {invoiceStatusData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {item.value} ใบ
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers & Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Customers */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Top 5 ลูกค้า (ยอดซื้อสูงสุด)
            </h3>
          </div>
          <div className="space-y-3">
            {topCustomers.length > 0 ? (
              topCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.count} ใบ</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ฿{customer.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                ยังไม่มีข้อมูล
              </div>
            )}
          </div>
        </div>

        {/* Top 5 Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Top 5 สินค้า (ขายดี)
            </h3>
          </div>
          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      ขายไป {product.quantity} ชิ้น
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ฿{product.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                ยังไม่มีข้อมูล
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ใบเสนอราคาล่าสุด
          </h3>
          <div className="space-y-3">
            {recentQuotations.length > 0 ? (
              recentQuotations.map((quotation: any) => (
                <div
                  key={quotation.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {quotation.quotationNo}
                    </p>
                    <p className="text-sm text-gray-600">
                      {quotation.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ฿{parseFloat(quotation.total).toLocaleString()}
                    </p>
                    {getStatusBadge(quotation.status, "quotation")}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                ยังไม่มีใบเสนอราคา
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ใบแจ้งหนี้ล่าสุด
          </h3>
          <div className="space-y-3">
            {recentInvoices.length > 0 ? (
              recentInvoices.map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {invoice.invoiceNo}
                    </p>
                    <p className="text-sm text-gray-600">
                      {invoice.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ฿{parseFloat(invoice.total).toLocaleString()}
                    </p>
                    {getStatusBadge(invoice.status, "invoice")}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                ยังไม่มีใบแจ้งหนี้
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">นัดหมายที่จะถึง</h2>
                <p className="text-sm text-gray-600">ใน 7 วันข้างหน้า</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/appointments')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ดูทั้งหมด →
            </button>
          </div>

          <div className="space-y-4">
            {upcomingAppointments.map((appointment: any) => {
              const daysUntil = Math.ceil(
                (new Date(appointment.appointmentDate).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
              );

              const isToday = daysUntil === 0;
              const isTomorrow = daysUntil === 1;

              const getTypeColor = (type: string) => {
                const colors: any = {
                  installation: 'bg-blue-100 text-blue-800',
                  payment: 'bg-green-100 text-green-800',
                  other: 'bg-gray-100 text-gray-800'
                };
                return colors[type] || colors.other;
              };

              return (
                <div
                  key={appointment.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/invoices/${appointment.invoiceId}`)}
                >
                  {/* Date Badge */}
                  <div className={`flex-shrink-0 w-16 text-center p-2 rounded-lg ${isToday ? 'bg-red-100' : 'bg-white border border-gray-200'
                    }`}>
                    <div className={`text-xs font-medium ${isToday ? 'text-red-600' : 'text-gray-600'
                      }`}>
                      {new Date(appointment.appointmentDate).toLocaleDateString('th-TH', {
                        month: 'short'
                      })}
                    </div>
                    <div className={`text-2xl font-bold ${isToday ? 'text-red-600' : 'text-gray-900'
                      }`}>
                      {new Date(appointment.appointmentDate).getDate()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {appointment.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(appointment.appointmentType)
                        }`}>
                        {appointment.appointmentType === 'installation' ? 'ติดตั้ง' :
                          appointment.appointmentType === 'payment' ? 'รับเงิน' : 'อื่นๆ'}
                      </span>
                    </div>

                    {appointment.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {appointment.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {(appointment.startTime || appointment.endTime) && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {appointment.startTime || '-'} - {appointment.endTime || '-'}
                          </span>
                        </div>
                      )}
                      {appointment.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{appointment.location}</span>
                        </div>
                      )}
                      {appointment.invoice && (
                        <div className="text-blue-600 font-medium">
                          {appointment.invoice.invoiceNo}
                        </div>
                      )}
                    </div>

                    {/* Time indicator */}
                    {isToday && (
                      <div className="flex items-center gap-1 mt-2 text-xs font-medium text-red-600">
                        <AlertCircle className="w-3 h-3" />
                        <span>วันนี้!</span>
                      </div>
                    )}
                    {isTomorrow && (
                      <div className="flex items-center gap-1 mt-2 text-xs font-medium text-orange-600">
                        <AlertCircle className="w-3 h-3" />
                        <span>พรุ่งนี้</span>
                      </div>
                    )}
                    {!isToday && !isTomorrow && daysUntil > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        อีก {daysUntil} วัน
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;