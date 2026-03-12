import { useEffect, useState } from "react";
import { FileText, Search, Receipt, Plus } from "lucide-react";
import { invoiceApi } from "../../services/api";
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/common/Pagination";

interface Invoice {
  id: number;
  invoiceNo: string;
  customerName: string;
  customerPhone: string | null;
  total: string;
  paidAmount: string;
  remainingAmount: string;
  status: string;
  createdAt: string;
  _count?: {
    items: number;
    payments: number;
  };
}

const InvoicesPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState<any>(null);
  const [allStatusCounts, setAllStatusCounts] = useState<any>({});

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (filterStatus && filterStatus !== "all") {
        params.status = filterStatus;
      }

      const response = await invoiceApi.getAll(params);
      setInvoices(response.data.data);
      setPagination(response.data.pagination);
      
      // Fetch status counts for all statuses
      await fetchStatusCounts();
    } catch (error) {
      console.error("Error fetching invoices:", error);
      alert("ไม่สามารถดึงข้อมูลใบแจ้งหนี้ได้");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      // Fetch counts for each status
      const statuses = ['unpaid', 'partial', 'paid', 'overdue'];
      const counts: any = {};
      
      for (const status of statuses) {
        const response = await invoiceApi.getAll({ status, limit: 1 });
        counts[status] = response.data.pagination?.total || 0;
      }
      
      // Get total count (all statuses)
      const allResponse = await invoiceApi.getAll({ limit: 1 });
      counts.total = allResponse.data.pagination?.total || 0;
      
      setAllStatusCounts(counts);
    } catch (error) {
      console.error("Error fetching status counts:", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, filterStatus, limit]);

  useEffect(() => {
    // Reset to page 1 when search changes
    if (page !== 1) {
      setPage(1);
    } else {
      fetchInvoices();
    }
  }, [searchTerm]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };



  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      unpaid: { label: "รอชำระ", color: "bg-yellow-100 text-yellow-800" },
      partial: { label: "ชำระบางส่วน", color: "bg-blue-100 text-blue-800" },
      paid: { label: "ชำระแล้ว", color: "bg-green-100 text-green-800" },
      overdue: { label: "เกินกำหนด", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status] || statusConfig.unpaid;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ใบแจ้งหนี้</h1>
          <p className="text-gray-600">ทั้งหมด {allStatusCounts.total || 0} รายการ</p>
        </div>
        <button
          onClick={() => navigate("/invoices/create")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างใบแจ้งหนี้</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">รอชำระ</div>
          <div className="text-2xl font-bold text-gray-900">
            {allStatusCounts.unpaid || 0}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">ชำระบางส่วน</div>
          <div className="text-2xl font-bold text-gray-900">
            {allStatusCounts.partial || 0}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">ชำระแล้ว</div>
          <div className="text-2xl font-bold text-gray-900">
            {allStatusCounts.paid || 0}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">เกินกำหนด</div>
          <div className="text-2xl font-bold text-gray-900">
            {allStatusCounts.overdue || 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่ใบแจ้งหนี้หรือชื่อลูกค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">ทุกสถานะ</option>
          <option value="unpaid">รอชำระ</option>
          <option value="partial">ชำระบางส่วน</option>
          <option value="paid">ชำระแล้ว</option>
          <option value="overdue">เกินกำหนด</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                เลขที่
              </th>
              <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ลูกค้า
              </th>
              <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ยอดรวม
              </th>
              <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ชำระแล้ว
              </th>
              <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                คงเหลือ
              </th>
              <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                สถานะ
              </th>
              <th className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                วันที่
              </th>
              <th className="px-3 py-2 md:px-6 md:py-3 text-right text-xs font-medium text-gray-500 uppercase">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map((invoice: Invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 md:px-6 md:py-4">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-gray-400" />
                    <span className="text-sm md:text-base font-medium text-gray-900">
                      {invoice.invoiceNo}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 md:px-6 md:py-4">
                  <div>
                    <div className="text-sm md:text-base font-medium text-gray-900">
                      {invoice.customerName}
                    </div>
                    {invoice.customerPhone && (
                      <div className="text-xs md:text-sm text-gray-500">
                        {invoice.customerPhone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 md:px-6 md:py-4">
                  <div className="text-sm md:text-base font-semibold text-gray-900">
                    ฿{parseFloat(invoice.total).toLocaleString()}
                  </div>
                </td>
                <td className="px-3 py-2 md:px-6 md:py-4">
                  <div className="text-sm md:text-base font-semibold text-green-600">
                    ฿{parseFloat(invoice.paidAmount).toLocaleString()}
                  </div>
                </td>
                <td className="px-3 py-2 md:px-6 md:py-4">
                  <div className="text-sm md:text-base font-semibold text-red-600">
                    ฿{parseFloat(invoice.remainingAmount).toLocaleString()}
                  </div>
                </td>
                <td className="px-3 py-2 md:px-6 md:py-4">{getStatusBadge(invoice.status)}</td>
                <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm text-gray-600">
                  {new Date(invoice.createdAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-3 py-2 md:px-6 md:py-4">
                  <div className="flex items-center justify-end gap-1 md:gap-2">
                    <button
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      className="p-1.5 md:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="ดูรายละเอียด"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoices.length === 0 && (
          <div className="text-center py-12 text-gray-500">ไม่พบใบแจ้งหนี้</div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
};

export default InvoicesPage;
