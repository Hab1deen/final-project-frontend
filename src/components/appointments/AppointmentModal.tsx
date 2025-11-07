import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, Phone, FileText } from 'lucide-react';
import { appointmentApi } from '../../services/api';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoiceId?: number;
  invoiceNo?: string;
  customerName?: string;
  appointment?: any; // สำหรับ Edit mode
}

const AppointmentModal = ({
  isOpen,
  onClose,
  onSuccess,
  invoiceId,
  invoiceNo,
  customerName,
  appointment
}: AppointmentModalProps) => {
  const [formData, setFormData] = useState({
    appointmentType: 'installation',
    title: '',
    description: '',
    appointmentDate: '',
    startTime: '09:00',
    endTime: '17:00',
    location: '',
    contactPerson: customerName || '',
    contactPhone: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);

  // โหลดข้อมูลเมื่อเป็นโหมดแก้ไข
  useEffect(() => {
    if (appointment) {
      setFormData({
        appointmentType: appointment.appointmentType || 'installation',
        title: appointment.title || '',
        description: appointment.description || '',
        appointmentDate: appointment.appointmentDate ? new Date(appointment.appointmentDate).toISOString().split('T')[0] : '',
        startTime: appointment.startTime || '09:00',
        endTime: appointment.endTime || '17:00',
        location: appointment.location || '',
        contactPerson: appointment.contactPerson || customerName || '',
        contactPhone: appointment.contactPhone || '',
        notes: appointment.notes || ''
      });
    } else {
      // Reset ถ้าเป็นโหมดสร้างใหม่
      setFormData({
        appointmentType: 'installation',
        title: '',
        description: '',
        appointmentDate: '',
        startTime: '09:00',
        endTime: '17:00',
        location: '',
        contactPerson: customerName || '',
        contactPhone: '',
        notes: ''
      });
    }
  }, [appointment, customerName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        invoiceId: invoiceId || appointment?.invoiceId
      };

      if (appointment) {
        // แก้ไข
        await appointmentApi.update(appointment.id, data);
        alert('แก้ไขนัดหมายสำเร็จ');
      } else {
        // สร้างใหม่
        await appointmentApi.create(data);
        alert('สร้างนัดหมายสำเร็จ');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {appointment ? 'แก้ไขนัดหมาย' : 'สร้างนัดหมายใหม่'}
            </h3>
            {invoiceNo && (
              <p className="text-sm text-gray-600 mt-1">
                ใบแจ้งหนี้: <span className="font-medium">{invoiceNo}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Appointment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ประเภทนัดหมาย *
            </label>
            <select
              value={formData.appointmentType}
              onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="installation">ติดตั้ง/ส่งมอบงาน</option>
              <option value="payment">รับชำระเงิน</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              หัวข้อนัดหมาย *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="เช่น ติดตั้งเครื่องปรับอากาศ"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รายละเอียด
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="รายละเอียดเพิ่มเติม..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                วันที่ *
              </label>
              <input
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                เวลาเริ่ม
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                เวลาสิ้นสุด
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              สถานที่
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="ที่อยู่หรือสถานที่นัดหมาย"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Contact Person & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                ผู้ติดต่อ
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="ชื่อผู้ติดต่อ"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="08X-XXX-XXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมายเหตุ
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="หมายเหตุเพิ่มเติม..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'กำลังบันทึก...' : (appointment ? 'บันทึกการแก้ไข' : 'สร้างนัดหมาย')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;