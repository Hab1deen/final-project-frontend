import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import Swal from 'sweetalert2';
import { receiptApi } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

interface Receipt {
  id: number;
  receiptNo: string;
  invoiceId: number;
  amount: string;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  invoice?: {
    invoiceNo: string;
    customerName: string;
    customerPhone: string | null;
    customerAddress: string | null;
    total: string;
  };
  user?: {
    name: string;
  };
}

const ReceiptDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const response = await receiptApi.getById(Number(id));
      setReceipt(response.data.data);
    } catch (error) {
      console.error("Error fetching receipt:", error);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด!', text: 'ไม่สามารถโหลดข้อมูลใบเสร็จได้' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReceipt();
    }
  }, [id]);

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: "เงินสด",
      transfer: "โอนเงิน",
      credit_card: "บัตรเครดิต",
      promptpay: "พร้อมเพย์",
      mobile_banking: "Mobile Banking",
      e_wallet: "E-Wallet",
      check: "เช็ค",
    };
    return methods[method] || method;
  };

  const handleDownload = async () => {
    const element = document.getElementById("receipt-document");
    if (!element || !receipt) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`ใบเสร็จรับเงิน-${receipt.receiptNo}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถสร้างไฟล์ PDF ได้",
      });
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="กำลังโหลดข้อมูล..." />;
  }

  if (!receipt) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">ไม่พบข้อมูลใบเสร็จ</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/receipts")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {receipt.receiptNo}
            </h1>
            <p className="text-gray-600">
              สร้างเมื่อ {new Date(receipt.createdAt).toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>

        <div className="flex gap-3 no-print">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            title="ส่งออกเป็น PDF"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ส่งออกเป็น PDF</span>
          </button>
        </div>
      </div>

      {/* Document */}
      <div
        id="receipt-document"
        className="bg-white rounded-lg shadow-lg mx-auto print:shadow-none print:rounded-none print:w-full"
        style={{ maxWidth: "210mm" }}
      >
        <div className="p-12 print:p-4">
          {/* Header - New Layout: Shop Info (Left) + Document Title (Right) */}
          <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-blue-600 print:mb-4 print:pb-2">
            {/* Left: Shop Info */}
            <div>
              <h2 className="text-base font-bold text-gray-900 print:text-sm">ระบบจัดการเอกสารธุรกิจ</h2>
              <p className="text-xs text-gray-600 print:text-[10px]">Business Document Management System</p>
              <div className="mt-2 text-xs text-gray-700 space-y-0.5 print:text-[10px]">
                <p>123 ถนนสุขุมวิท กรุงเทพฯ 10110</p>
                <p>Tel: 02-123-4567 | Email: info@business.com</p>
                <p>เลขประจำตัวผู้เสียภาษี: 0-1234-56789-01-2</p>
              </div>
            </div>
            
            {/* Right: Document Title */}
            <div className="text-right">
              <h1 className="text-3xl font-bold text-blue-600 print:text-2xl">ใบเสร็จรับเงิน</h1>
              <p className="text-lg font-medium text-gray-600 print:text-base">RECEIPT</p>
            </div>
          </div>

          {/* Info Section - Customer (Left) + Receipt Info (Right) */}
          <div className="flex flex-col md:flex-row gap-6 mb-6 print:flex-row print:gap-6 print:mb-4">
            
            {/* Left Column - Customer Info */}
            <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-300">ที่ได้รับจาก | RECEIVED FROM</h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="w-20 font-bold text-gray-700">ชื่อ / Name</span>
                  <span className="flex-1 text-gray-900 font-semibold">{receipt.invoice?.customerName}</span>
                </div>
                {receipt.invoice?.customerPhone && (
                  <div className="flex">
                    <span className="w-20 font-bold text-gray-700">โทรศัพท์ / Phone</span>
                    <span className="flex-1 text-gray-900">{receipt.invoice.customerPhone}</span>
                  </div>
                )}
                {receipt.invoice?.customerAddress && (
                  <div className="flex">
                    <span className="w-20 font-bold text-gray-700">ที่อยู่ / Address</span>
                    <span className="flex-1 text-gray-900">{receipt.invoice.customerAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Receipt Info */}
            <div className="w-full md:w-80 print:w-80">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-3 text-sm">
                   <div className="flex justify-between">
                      <span className="font-bold text-gray-700">เลขที่ใบเสร็จ / Receipt No.</span>
                      <span className="font-bold text-blue-600">{receipt.receiptNo}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="font-bold text-gray-700">วันที่ / Date</span>
                      <span className="font-semibold text-gray-900">{new Date(receipt.createdAt).toLocaleDateString("th-TH")}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="font-bold text-gray-700">วิธีชำระ / Payment</span>
                      <span className="font-semibold text-gray-900">{getPaymentMethodLabel(receipt.paymentMethod)}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details Table */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-3">รายละเอียดการชำระเงิน | PAYMENT DETAILS</h3>
            <div className="border-collapse overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-4 py-3 text-left font-bold border border-blue-700">
                      เลขที่ใบแจ้งหนี้<br/><span className="text-xs font-normal">Invoice No.</span>
                    </th>
                    <th className="px-4 py-3 text-right font-bold border border-blue-700">
                      จำนวนเงิน<br/><span className="text-xs font-normal">Amount</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 hover:bg-blue-50/30">
                    <td className="px-4 py-3 border-l border-r border-gray-200">
                      <button
                        onClick={() => navigate(`/invoices/${receipt.invoiceId}`)}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        {receipt.invoice?.invoiceNo}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 border-r border-gray-200">
                      {parseFloat(receipt.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="mb-6">
            <div className="flex justify-end">
              <div className="w-80">
                <div className="flex justify-between py-3 px-4 bg-blue-50/50 rounded text-base font-bold text-gray-900">
                  <span>จำนวนเงินที่ชำระ / Total Amount</span>
                  <span>
                    {parseFloat(receipt.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {receipt.notes && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">หมายเหตุ</h3>
              <p className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
                {receipt.notes}
              </p>
            </div>
          )}

          {/* Bank Details */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-300">
              ข้อมูลการชำระเงิน | PAYMENT INFORMATION
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="w-20 font-bold text-gray-900">ธนาคาร :</span>
                <span>กสิกรไทย</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 font-bold text-gray-900">เลขบัญชี :</span>
                <span>209-1-72241-3</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 font-bold text-gray-900">ชื่อบัญชี :</span>
                <span>ระบบจัดการเอกสารธุรกิจ</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600 print:mt-6 print:pt-4">
            <p>ขอบคุณที่ใช้บริการ</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetailPage;