import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ฟังก์ชัน Export PDF สำหรับ Quotation
export const exportQuotationToPDF = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // ซ่อนปุ่มและส่วนที่ไม่ต้องการใน PDF
    const buttons = element.querySelectorAll('.no-print');
    buttons.forEach(btn => {
      (btn as HTMLElement).style.display = 'none';
    });

    // สร้าง canvas จาก HTML
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,     
      allowTaint: true,  
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0    
    });

    // แสดงปุ่มกลับ
    buttons.forEach(btn => {
      (btn as HTMLElement).style.display = '';
    });

    // สร้าง PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // เพิ่มหน้าแรก
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // เพิ่มหน้าถัดไป (ถ้ามี)
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // บันทึก PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};

// ฟังก์ชัน Export PDF สำหรับ Invoice
export const exportInvoiceToPDF = async (elementId: string, filename: string) => {
  return exportQuotationToPDF(elementId, filename);
};