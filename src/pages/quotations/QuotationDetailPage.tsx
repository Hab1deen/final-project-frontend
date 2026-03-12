import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ArrowRight,
  PenTool
} from "lucide-react";
import { showSuccess, showError, showDeleteConfirm } from '../../utils/alert';
import { quotationApi } from "../../services/api";
import SignatureSelector from "../../components/signature/SignatureSelector";
import ImageGallery from "../../components/common/ImageGallery";
import { exportQuotationToPDF } from "../../utils/pdfExport";

const QuotationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignatureSelector, setShowSignatureSelector] = useState(false);
  const [signerName, setSignerName] = useState("");

  const [converting, setConverting] = useState(false);

  useEffect(() => {
    // ถ้าเป็น "new" ก็ไม่ต้อง fetch
    if (id && id !== "new") {
      fetchQuotation();
    }
  }, [id]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await quotationApi.getById(parseInt(id!));
      setQuotation(response.data.data);
    } catch (error) {
      console.error("Error fetching quotation:", error);
      showError('ไม่สามารถดึงข้อมูลใบเสนอราคาได้');
      navigate("/quotations");
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = async () => {
    const result = await showDeleteConfirm(
      'คุณต้องการแปลงเป็นใบแจ้งหนี้ใช่หรือไม่?',
      'การกระทำนี้จะสร้างใบแจ้งหนี้ใหม่',
      'แปลง'
    );

    if (!result.isConfirmed) return;

    try {
      setConverting(true);
      await quotationApi.convertToInvoice(parseInt(id!));
      showSuccess('แปลงเป็นใบแจ้งหนี้สำเร็จ');
      navigate("/invoices");
    } catch (error) {
      console.error("Error converting:", error);
      showError('ไม่สามารถแปลงเป็นใบแจ้งหนี้ได้');
    } finally {
      setConverting(false);
    }
  };

  const handleSelectSignature = async (signatureUrl: string, templateId?: number) => {
    try {
      await quotationApi.addSignature(parseInt(id!), {
        type: "shop",
        signatureData: signatureUrl,
        signerName,
        templateId,
      });

      showSuccess('บันทึกลายเซ็นสำเร็จ');
      setShowSignatureSelector(false);
      setSignerName("");
      fetchQuotation(); // โหลดข้อมูลใหม่
    } catch (error) {
      console.error("Error saving signature:", error);
      showError('เกิดข้อผิดพลาดในการบันทึกลายเซ็น');
    }
  };



  const getStatusBadge = (status: string) => {
    const config: any = {
      draft: { label: "ร่าง", color: "bg-gray-100 text-gray-800" },
      sent: { label: "ส่งแล้ว", color: "bg-blue-100 text-blue-800" },
      accepted: { label: "อนุมัติ", color: "bg-green-100 text-green-800" },
      rejected: { label: "ปฏิเสธ", color: "bg-red-100 text-red-800" },
      converted: { label: "แปลงแล้ว", color: "bg-purple-100 text-purple-800" },
    };
    const s = config[status] || config.draft;
    return (
      <span className={`px - 3 py - 1 text - sm font - medium rounded ${s.color} `}>
        {s.label}
      </span>
    );
  };

  const handlePrint = async () => {
    try {
      await exportQuotationToPDF(
        "quotation-document",
        `${quotation.quotationNo}.pdf`
      );
      showSuccess('ส่งออก PDF สำเร็จ');
    } catch (error) {
      console.error("Error exporting PDF:", error);
      // Fallback to print
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  if (!quotation) return null;

  return (
    <div className="space-y-6">
      {/* Header - Hide on print */}
      <div className="flex items-center justify-between print:hidden no-print">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/quotations")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {quotation.quotationNo}
              </h1>
              {getStatusBadge(quotation.status)}
            </div>
            <p className="text-gray-600">
              สร้างเมื่อ{" "}
              {new Date(quotation.createdAt).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {/* Secondary Actions (Utilities) */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            title="พิมพ์หรือบันทึกเป็น PDF"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ส่งออกเป็น PDF</span>
          </button>

          {/* Primary Actions Group */}


          {!quotation.signatures?.some((sig: any) => sig.type === "shop") && (
            <button
              onClick={() => setShowSignatureSelector(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <PenTool className="w-4 h-4" />
              <span>เซ็นชื่อ</span>
            </button>
          )}

          {quotation.status !== "converted" && (
            <button
              onClick={handleConvertToInvoice}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              <ArrowRight className="w-4 h-4" />
              <span>แปลงเป็นใบแจ้งหนี้</span>
            </button>
          )}
        </div>
      </div>

      {/* Document - A4 Paper Style */}
      <div
        id="quotation-document"
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
              <h1 className="text-3xl font-bold text-blue-600 print:text-2xl">ใบเสนอราคา</h1>
              <p className="text-lg font-medium text-gray-600 print:text-base">QUOTATION</p>
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
                  <span className="flex-1 text-gray-900 font-semibold">{quotation.customerName}</span>
                </div>
                {quotation.customer?.taxId && (
                  <div className="flex">
                    <span className="w-20 font-bold text-gray-700">เลขที่ภาษี</span>
                    <span className="flex-1 text-gray-900">{quotation.customer.taxId}</span>
                  </div>
                )}
                {quotation.customerPhone && (
                  <div className="flex">
                    <span className="w-20 font-bold text-gray-700">โทรศัพท์</span>
                    <span className="flex-1 text-gray-900">{quotation.customerPhone}</span>
                  </div>
                )}
                {quotation.customerAddress && (
                  <div className="flex">
                    <span className="w-20 font-bold text-gray-700">ที่อยู่</span>
                    <span className="flex-1 text-gray-900">{quotation.customerAddress}</span>
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
                      <span className="font-bold text-blue-600">{quotation.quotationNo}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="font-bold text-gray-700">วันที่</span>
                      <span className="font-semibold text-gray-900">{new Date(quotation.createdAt).toLocaleDateString("th-TH")}</span>
                   </div>
                   {quotation.validUntil && (
                     <div className="flex justify-between">
                        <span className="font-bold text-gray-700">วันหมดอายุ</span>
                        <span className="font-semibold text-gray-900">{new Date(quotation.validUntil).toLocaleDateString("th-TH")}</span>
                     </div>
                   )}
                   <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="font-bold text-gray-700">สถานะ</span>
                        {getStatusBadge(quotation.status)}
                   </div>
                </div>
              </div>
            </div>
          </div>

        {/* Items Table - Blue Header Style */}
        <div className="mb-4 print:mb-2">
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
                {quotation.items.map((item: any, index: number) => (
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

          {/* Summary - PEAK Style */}
          <div className="flex justify-end mb-8 print:mb-4">
            <div className="w-[300px]">
              <div className="space-y-2 text-sm text-gray-800 print:space-y-1">
                <div className="flex justify-between py-1">
                  <span>มูลค่ารวม/Subtotal</span>
                  <span className="font-semibold">
                    {parseFloat(quotation.subtotal).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })} บาท
                  </span>
                </div>
                {parseFloat(quotation.discount) > 0 && (
                  <div className="flex justify-between py-1 text-red-600">
                    <span>ส่วนลด/Discount</span>
                    <span className="font-semibold">
                      -{parseFloat(quotation.discount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })} บาท
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span>ภาษีมูลค่าเพิ่ม/VAT {quotation.vat}%</span>
                  <span className="font-semibold">
                    {(
                      ((parseFloat(quotation.subtotal) -
                        parseFloat(quotation.discount)) *
                        parseFloat(quotation.vat)) /
                      100
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })} บาท
                  </span>
                </div>
                <div className="flex justify-between py-3 px-4 bg-blue-50/50 rounded text-base font-bold text-gray-900 mt-2">
                  <span>จำนวนเงินทั้งสิ้น</span>
                  <span>
                    {parseFloat(quotation.total).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })} บาท
                  </span>
                </div>
              </div>
            </div>
          </div>


          {/* Notes */}
          {quotation.notes && (
            <div className="mb-6 p-4 bg-gray-50 border-l-4 border-blue-500 rounded-r-lg print:mb-4 print:p-2 print:text-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-1 print:mb-1">
                หมายเหตุ:
              </h3>
              <p className="text-gray-700 whitespace-pre-line text-sm">
                {quotation.notes}
              </p>
            </div>
          )}

          {/* Images Gallery */}
          {/* 2. Gallery เดิม */}
          {quotation.images && quotation.images.length > 0 && (
            <ImageGallery images={quotation.images} title="รูปภาพประกอบเพิ่มเติม" />
          )}

          {/* Terms & Signature */}
          <div className="grid grid-cols-2 gap-6 mt-6 pt-4 border-t border-gray-200 print:mt-2 print:pt-1 print:gap-2 print:page-break-inside-avoid">
            <div>
              <h3 className="text-xs font-bold text-gray-700 mb-2 print:mb-1 print:text-[10px]">
                เงื่อนไขและข้อตกลง
              </h3>
              <ul className="text-[10px] text-gray-600 space-y-0.5 print:text-[8px]">
                <li>• ใบเสนอราคานี้มีอายุ 30 วัน นับจากวันที่ออกเอกสาร</li>
                <li>• ราคาดังกล่าวรวม VAT 7% แล้ว</li>
                <li>• เงื่อนไขการชำระเงิน: เงินสด หรือโอนเงิน</li>
                <li>• การยกเลิกหลังจากสั่งซื้อแล้วจะไม่คืนเงิน</li>
              </ul>
            </div>
          </div>

          {/* Signatures Display */}
          {quotation.signatures && quotation.signatures.length > 0 && (
            <div className="mt-4 pt-2 border-t border-gray-200 print:mt-2 print:pt-1">
              <h3 className="text-xs font-bold text-gray-900 mb-2 print:mb-1 print:text-[10px]">ลายเซ็น</h3>
              <div className="flex gap-4 print:gap-2">
                {/* 1. ลายเซ็นยืนยันการจ้าง (New) */}
                {quotation.customerSignature && (
                  <div className="flex-1">
                    <div className="border border-gray-300 rounded p-2 bg-white min-h-[80px] flex items-center justify-center print:min-h-[50px] print:p-1">
                      <img
                        src={quotation.customerSignature}
                        alt="ลายเซ็นผู้ว่าจ้าง"
                        className="max-h-16 print:max-h-12"
                      />
                    </div>
                    <div className="mt-3 text-center">
                      <p className="font-semibold text-gray-900">
                        {quotation.customerName}
                      </p>
                      <p className="text-sm text-gray-600">ผู้ว่าจ้าง</p>
                      <p className="text-xs text-gray-500 mt-1">
                        วันที่:{" "}
                        {new Date(quotation.createdAt).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. ลายเซ็นผู้เสนอราคา (shop) */}
                {quotation.signatures
                  .filter((sig: any) => sig.type === "shop")
                  .map((signature: any) => (
                    <div key={signature.id} className="flex-1">
                      <div className="border border-gray-300 rounded p-2 bg-white print:p-1">
                        <img
                          src={signature.signatureUrl}
                          alt="ลายเซ็นผู้เสนอราคา"
                          className="max-h-16 mx-auto print:max-h-12"
                        />
                      </div>
                      <div className="mt-3 text-center">
                        <p className="font-semibold text-gray-900">
                          {signature.signerName}
                        </p>
                        <p className="text-sm text-gray-600">
                          ผู้เสนอราคา
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          วันที่:{" "}
                          {new Date(signature.signedAt).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center print:mt-4 print:pt-4">
          </div>
        </div>
      </div>
      {/* Signature Selector Modal */}
      {showSignatureSelector && (
        <SignatureSelector
          title="ลายเซ็นผู้เสนอราคา"
          signerName={signerName}
          onSignerNameChange={setSignerName}
          onSelect={handleSelectSignature}
          onCancel={() => {
            setShowSignatureSelector(false);
            setSignerName("");
          }}
        />
      )}



      {/* Loading Overlay for Converting */}
      {converting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              กำลังแปลงเป็นใบแจ้งหนี้...
            </h3>
            <p className="text-sm text-gray-600">
              กรุณารอสักครู่ ระบบกำลังสร้างเอกสารและส่งอีเมล
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationDetailPage;
