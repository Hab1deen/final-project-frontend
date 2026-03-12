import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Receipt,
  User,
  Phone,
  MapPin,
  Calendar,
  Download,
  DollarSign,
  PenTool,
  FileCheck,
  Image as ImageIcon,
} from "lucide-react";
import { showSuccess, showError } from '../../utils/alert';
import Swal from 'sweetalert2';
import { invoiceApi, receiptApi } from "../../services/api";
import SignatureSelector from "../../components/signature/SignatureSelector";
import ImageGallery from "../../components/common/ImageGallery";
import ImageUploadModal from "../../components/modals/ImageUploadModal";
import CreateReceiptModal from "../../components/modals/CreateReceiptModal";
import { exportInvoiceToPDF } from "../../utils/pdfExport";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import qrcode from 'qrcode';
import generatePayload from 'promptpay-qr';

const PROMPTPAY_ID = "0928980434"; // TODO: Should be from config/env


const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [showSignatureSelector, setShowSignatureSelector] = useState(false);
  const [signatureType, setSignatureType] = useState<"shop" | "customer" | "acceptance">(
    "shop"
  );
  const [signerName, setSignerName] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);

  const [showImageUpload, setShowImageUpload] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");


  useEffect(() => {
    fetchInvoice();
    fetchReceipts();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceApi.getById(parseInt(id!));
      setInvoice(response.data.data);

      // Generate QR Code if there's a remaining amount
      if (response.data.data.remainingAmount > 0) {
        try {
          const payload = generatePayload(PROMPTPAY_ID, { amount: parseFloat(response.data.data.remainingAmount) });
          const url = await qrcode.toDataURL(payload);
          setQrCodeDataUrl(url);
        } catch (err) {
          console.error("Error generating QR:", err);
        }
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      showError('ไม่สามารถดึงข้อมูลใบแจ้งหนี้ได้');
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  };


  const fetchReceipts = async () => {
    try {
      const response = await receiptApi.getByInvoiceId(parseInt(id!));
      setReceipts(response.data.data || []);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    }
  };

  const handleReceiptSuccess = () => {
    fetchInvoice();
    fetchReceipts();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Record payment
      await invoiceApi.recordPayment(parseInt(id!), {
        amount: parseFloat(paymentAmount),
        paymentMethod,
        notes: paymentNotes,
      });

      // Success alert with SweetAlert2
      await Swal.fire({
        icon: 'success',
        title: 'บันทึกการชำระเงินสำเร็จ!',
        text: `บันทึกการชำระ ${parseFloat(paymentAmount).toLocaleString()} บาทเรียบร้อยแล้ว`,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#3b82f6',
      });

      // Reset form
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentMethod("cash");
      setPaymentNotes("");
      fetchInvoice();
    } catch (error) {
      console.error("Error recording payment:", error);
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: 'ไม่สามารถบันทึกการชำระเงินได้',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const openSignatureSelector = (type: "shop" | "customer" | "acceptance") => {
    setSignatureType(type);
    setShowSignatureSelector(true);
  };

  const handleSelectSignature = async (signatureUrl: string, templateId?: number) => {
    try {
      if (signatureType === "acceptance") {
        // Job acceptance signature - update invoice directly
        await invoiceApi.update(parseInt(id!), {
          acceptanceSignature: signatureUrl,
        });
        showSuccess('บันทึกลายเซ็นรับงานสำเร็จ');
      } else {
        // Shop or customer signature
        await invoiceApi.addSignature(parseInt(id!), {
          type: signatureType,
          signatureData: signatureUrl,
          signerName,
          templateId,
        });
        showSuccess('บันทึกลายเซ็นสำเร็จ');
      }

      setShowSignatureSelector(false);
      setSignerName("");
      setSignatureType("shop");
      fetchInvoice(); // Reload data
    } catch (error) {
      console.error("Error saving signature:", error);
      showError('เกิดข้อผิดพลาดในการบันทึกลายเซ็น');
    }
  };



  const handleUploadWorkImage = async (imageUrl: string) => {
    try {
      await invoiceApi.update(parseInt(id!), {
        workImages: imageUrl,
      });

      showSuccess('อัปโหลดรูปผลงานสำเร็จ');
      fetchInvoice(); // โหลดข้อมูลใหม่
    } catch (error) {
      console.error("Error uploading work image:", error);
      showError('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportInvoiceToPDF("invoice-document", `${invoice.invoiceNo}.pdf`);
      showSuccess('ส่งออก PDF สำเร็จ');
    } catch (error) {
      console.error("Error exporting PDF:", error);
      // Fallback to print
      window.print();
    }
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      unpaid: { label: "รอชำระ", color: "bg-yellow-100 text-yellow-800" },
      partial: { label: "ชำระบางส่วน", color: "bg-blue-100 text-blue-800" },
      paid: { label: "ชำระแล้ว", color: "bg-green-100 text-green-800" },
      overdue: { label: "เกินกำหนด", color: "bg-red-100 text-red-800" },
    };
    const s = config[status] || config.unpaid;
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded ${s.color}`}>
        {s.label}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="กำลังโหลดข้อมูล..." />;
  }

  if (!invoice) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/invoices")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {invoice.invoiceNo}
              </h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-gray-600">
              สร้างเมื่อ{" "}
              {new Date(invoice.createdAt).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-3 no-print">
          {/* Utility / Secondary Actions */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            title="Export PDF"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ส่งออกเป็น PDF</span>
          </button>

          {/* Action Group */}
          {/* Upload Work Image - แสดงถ้ายังไม่มีรูป After */}
          {!invoice.workImages && invoice.status !== "unpaid" && (
            <button
              onClick={() => setShowImageUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="แนบรูปผลงาน (After)"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden lg:inline">แนบรูปผลงาน</span>
            </button>
          )}

          {/* Customer Job Acceptance - แสดงถ้ามีรูป After แล้ว แต่ยังไม่มีลายเซ็นรับงาน */}
          {invoice.workImages && !invoice.acceptanceSignature && (
            <button
              onClick={() => openSignatureSelector("acceptance")}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="ลูกค้าเซ็นรับงาน"
            >
              <PenTool className="w-4 h-4" />
              <span className="hidden lg:inline">ลูกค้าเซ็นรับงาน</span>
            </button>
          )}

          {/* Payment Button - Show when not fully paid */}
          {invoice.status !== "paid" && (
            <button
              onClick={() => navigate(`/invoices/${id}/payment`)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
              title="รับชำระเงิน"
            >
              <DollarSign className="w-4 h-4" />
              <span>ชำระเงิน</span>
            </button>
          )}

          {/* Signature */}
          {!invoice.signatures?.some((sig: any) => sig.type === "shop") && (
            <button
              onClick={() => openSignatureSelector("shop")}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="เซ็นกำกับร้านค้า"
            >
              <PenTool className="w-4 h-4" />
              <span className="hidden lg:inline">เซ็นชื่อ</span>
            </button>
          )}


        </div>
      </div>

      {/* Document - A4 Paper Style */}
      <div
        id="invoice-document"
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
            <h1 className="text-3xl font-bold text-blue-600 print:text-2xl">ใบแจ้งหนี้</h1>
            <p className="text-lg font-medium text-gray-600 print:text-base">INVOICE</p>
          </div>
        </div>

        {/* Info Section - Customer (Left) + Document Info (Right) */}
        <div className="flex flex-col md:flex-row gap-6 mb-6 print:flex-row print:gap-6 print:mb-4">
          
          {/* Left Column - Customer Info */}
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-300">ข้อมูลลูกค้า | CUSTOMER INFORMATION</h3>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="w-20 font-bold text-gray-700">ชื่อ</span>
                <span className="flex-1 text-gray-900 font-semibold">{invoice.customerName}</span>
              </div>
              {invoice.customer?.taxId && (
                <div className="flex">
                  <span className="w-20 font-bold text-gray-700">เลขที่ภาษี</span>
                  <span className="flex-1 text-gray-900">{invoice.customer.taxId}</span>
                </div>
              )}
              {invoice.customerPhone && (
                <div className="flex">
                  <span className="w-20 font-bold text-gray-700">โทรศัพท์</span>
                  <span className="flex-1 text-gray-900">{invoice.customerPhone}</span>
                </div>
              )}
              {invoice.customerAddress && (
                <div className="flex">
                  <span className="w-20 font-bold text-gray-700">ที่อยู่</span>
                  <span className="flex-1 text-gray-900">{invoice.customerAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Document Info */}
          <div className="w-full md:w-80 print:w-80">
            <div>
              <div className="space-y-3 text-sm">
                 <div className="flex justify-between">
                    <span className="font-bold text-gray-700">เลขที่เอกสาร</span>
                    <span className="font-bold text-blue-600">{invoice.invoiceNo}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="font-bold text-gray-700">วันที่</span>
                    <span className="font-semibold text-gray-900">{new Date(invoice.createdAt).toLocaleDateString("th-TH")}</span>
                 </div>
                 {invoice.dueDate && (
                   <div className="flex justify-between">
                      <span className="font-bold text-gray-700">ครบกำหนด</span>
                      <span className="font-semibold text-gray-900">{new Date(invoice.dueDate).toLocaleDateString("th-TH")}</span>
                   </div>
                 )}
                 <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="font-bold text-gray-700">สถานะ</span>
                      {getStatusBadge(invoice.status)}
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table - Blue Header Style */}
        <div className="mb-8 print:mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="py-3 px-4 text-center font-bold w-[8%] print:py-2 print:px-2 border border-blue-700">
                  ลำดับ<br/><span className="text-xs font-normal">No.</span>
                </th>
                <th className="py-3 px-4 text-left font-bold w-[42%] print:py-2 print:px-2 border border-blue-700">
                  รายการ<br/><span className="text-xs font-normal">Description</span>
                </th>
                <th className="py-3 px-4 text-center font-bold w-[15%] print:py-2 print:px-2 border border-blue-700">
                  จำนวน<br/><span className="text-xs font-normal">Quantity</span>
                </th>
                <th className="py-3 px-4 text-right font-bold w-[17%] print:py-2 print:px-2 border border-blue-700">
                  ราคา/หน่วย<br/><span className="text-xs font-normal">Unit Price</span>
                </th>
                <th className="py-3 px-4 text-right font-bold w-[18%] print:py-2 print:px-2 border border-blue-700">
                  จำนวนเงิน<br/><span className="text-xs font-normal">Amount</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, index: number) => (
                <tr key={item.id} className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                  <td className="py-3 px-4 text-center text-gray-700 print:py-2 print:px-2 border-l border-r border-gray-200">{index + 1}</td>
                  <td className="py-3 px-4 print:py-2 print:px-2 border-r border-gray-200">
                    <div className="font-semibold text-gray-900">
                      {item.productName}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-600 mt-1">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700 print:py-2 print:px-2 border-r border-gray-200">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 print:py-2 print:px-2 border-r border-gray-200">
                    {parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900 print:py-2 print:px-2 border-r border-gray-200">
                    {parseFloat(item.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Added spacer to push summary down */}
        <div className="min-h-[150px] print:min-h-[100px]"></div>

        {/* Summary Section - Right Aligned */}
        <div className="flex justify-end mb-6 print:mb-4">
          <div className="w-full md:w-80 print:w-80">
            <div className="space-y-2 text-sm border-t-2 border-blue-600 pt-4">
              <div className="flex justify-between py-2">
                <span className="text-gray-700">ยอดรวม</span>
                <span className="font-semibold text-gray-900">
                  {parseFloat(invoice.subtotal).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })} บาท
                </span>
              </div>
              {parseFloat(invoice.discount) > 0 && (
                <div className="flex justify-between py-2 text-red-600">
                  <span>ส่วนลด</span>
                  <span className="font-semibold">
                    -{parseFloat(invoice.discount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })} บาท
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-gray-700">ภาษีมูลค่าเพิ่ม {invoice.vat}%</span>
                <span className="font-semibold text-gray-900">
                  {(
                    ((parseFloat(invoice.subtotal) -
                      parseFloat(invoice.discount)) *
                      parseFloat(invoice.vat)) /
                    100
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })} บาท
                </span>
              </div>
              <div className="flex justify-between py-3 px-4 bg-blue-50/50 rounded text-base font-bold text-gray-900 mt-2">
                <span>จำนวนเงินทั้งสิ้น</span>
                <span>
                  {parseFloat(invoice.total).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })} บาท
                </span>
              </div>
              {parseFloat(invoice.paidAmount) > 0 && (
                <div className="pt-2 border-t border-blue-200">
                  <div className="flex justify-between py-1 text-green-600">
                    <span className="font-medium">ชำระแล้ว</span>
                    <span className="font-semibold">
                      ฿{parseFloat(invoice.paidAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-red-600">
                    <span className="font-medium">คงเหลือ</span>
                    <span className="font-semibold">
                      ฿{parseFloat(invoice.remainingAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bank/Payment Channels - New Design */}
        <div className="mb-6 mt-8 border-t border-gray-200 pt-4 print:mb-4 print:mt-6">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            
            <span>ช่องทางชำระเงิน</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank 1 - Kasikorn */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                K
              </div>
              <div className="text-sm flex-1">
                <div className="font-semibold text-gray-900">ธ.กสิกรไทย</div>
                <div className="text-gray-600"> <span className="font-semibold text-gray-900">209-1-72241-3</span></div>
                <div className="text-gray-500 text-xs mt-1">ชื่อบัญชี ฮาบีดีน บุญสาลี</div>
              </div>
            </div>

            {/* Bank 2 - SCB */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                S
              </div>
              <div className="text-sm flex-1">
                <div className="font-semibold text-gray-900">ธ.ไทยพาณิชย์</div>
                <div className="text-gray-600"> <span className="font-semibold text-gray-900">302-429452-4</span></div>
                <div className="text-gray-500 text-xs mt-1">ชื่อบัญชี ฮาบีดีน บุญสาลี</div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-6 p-4 bg-gray-50 border-l-4 border-blue-500 rounded-r-lg print:mb-4 print:p-2 print:text-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-1 print:mb-1">
              หมายเหตุ:
            </h3>
            <p className="text-gray-700 whitespace-pre-line text-sm">{invoice.notes}</p>
          </div>
        )}




        {/* Work Images (After) */}
        {invoice.workImages && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              แนบรูปภาพ
            </h3>
            <div className="border border-gray-200 rounded p-2">
              <img
                src={invoice.workImages}
                alt="Work Completed"
                className="max-h-64 mx-auto object-contain rounded"
              />
            </div>
          </div>
        )}



        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-600 print:mt-6 print:pt-4">
          <p>ขอบคุณที่ใช้บริการ</p>
        </div>
        </div>
      </div>

      {/* Receipts Section - ย้ายออกมาด้านนอก invoice-document */}
      {receipts && receipts.length > 0 && (
        <div className="mb-8 print:hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              ใบเสร็จรับเงิน ({receipts.length} ใบ)
            </h3>
          </div>
          <div className="space-y-3">
            {receipts.map((receipt: any, index: number) => {
              const paymentMethodLabel: Record<string, string> = {
                cash: "เงินสด",
                transfer: "โอนเงิน",
                credit_card: "บัตรเครดิต",
                promptpay: "พร้อมเพย์",
                mobile_banking: "Mobile Banking",
                e_wallet: "E-Wallet",
                check: "เช็ค",
              };

              return (
                <div
                  key={receipt.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/receipts/${receipt.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl">
                      <FileCheck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {receipt.receiptNo}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-200 text-indigo-800 text-xs font-semibold rounded-full">
                          {paymentMethodLabel[receipt.paymentMethod] ||
                            receipt.paymentMethod}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(receipt.createdAt).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                      {receipt.notes && (
                        <div className="text-sm text-gray-500 mt-1">
                          📝 {receipt.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      ฿
                      {parseFloat(receipt.amount).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      คลิกเพื่อดูรายละเอียด →
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Modal - Improved */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl">
              <div className="flex items-center gap-3 text-white">
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <DollarSign className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">บันทึกการรับชำระเงิน</h2>
                  <p className="text-green-100 text-sm mt-1">
                    เลขที่ใบแจ้งหนี้: {invoice.invoiceNo}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Amount Info Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    ยอดรวมทั้งหมด
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    ฿
                    {parseFloat(invoice.total).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-green-700">
                    ชำระแล้ว
                  </span>
                  <span className="text-lg font-semibold text-green-600">
                    ฿
                    {parseFloat(invoice.paidAmount).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="pt-3 border-t border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-red-700">
                      คงเหลือ
                    </span>
                    <span className="text-2xl font-bold text-red-600">
                      ฿
                      {parseFloat(invoice.remainingAmount).toLocaleString(
                        "th-TH",
                        { minimumFractionDigits: 2 }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-5">
                {/* Payment Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    จำนวนเงินที่รับ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">
                      ฿
                    </span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      max={invoice.remainingAmount}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    สูงสุด: ฿
                    {parseFloat(invoice.remainingAmount).toLocaleString(
                      "th-TH",
                      { minimumFractionDigits: 2 }
                    )}
                  </p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    วิธีการชำระ
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === "cash"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">💵</div>
                        <div className="text-sm font-medium">เงินสด</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("transfer")}
                      className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === "transfer"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">🏦</div>
                        <div className="text-sm font-medium">โอนเงิน</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("credit")}
                      className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === "credit"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">💳</div>
                        <div className="text-sm font-medium">บัตรเครดิต</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    หมายเหตุ
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                    placeholder="เลขที่อ้างอิง, หมายเหตุเพิ่มเติม..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    บันทึกการชำระ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Images Gallery */}
      {invoice.images && invoice.images.length > 0 && (
        <ImageGallery
          images={invoice.images}
          title="รูปภาพการติดตั้ง/ส่งมอบงาน"
        />
      )}

      {/* Signature Selector Modal */}
      {showSignatureSelector && (
        <SignatureSelector
          title={
            signatureType === "acceptance"
              ? "ลายเซ็นรับงาน"
              : signatureType === "shop"
                ? "ลายเซ็นผู้ออกใบแจ้งหนี้"
                : "ลายเซ็นลูกค้า"
          }
          signerName={signerName}
          onSignerNameChange={setSignerName}
          onSelect={handleSelectSignature}
          onCancel={() => {
            setShowSignatureSelector(false);
            setSignerName("");
            setSignatureType("shop");
          }}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && invoice && (
        <CreateReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          invoice={{
            id: invoice.id,
            invoiceNo: invoice.invoiceNo,
            customerName: invoice.customerName,
            total: invoice.total,
            paidAmount: invoice.paidAmount,
            remainingAmount: invoice.remainingAmount,
          }}
          onSuccess={handleReceiptSuccess}
        />
      )}

      {/* Image Upload Modal */}
      {showImageUpload && (
        <ImageUploadModal
          isOpen={showImageUpload}
          onClose={() => setShowImageUpload(false)}
          onSuccess={handleUploadWorkImage}
          title="แนบรูปผลงาน (After)"
          description="อัปโหลดรูปภาพผลงานหลังจากเสร็จสิ้นการทำงาน"
        />
      )}
    </div>
  );
};

export default InvoiceDetailPage;
