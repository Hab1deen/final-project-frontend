import { useState, useEffect } from 'react';
import { Calendar, Plus, Filter } from 'lucide-react';
import { appointmentApi } from '../../services/api';
import AppointmentModal from '../../components/appointments/AppointmentModal';
import AppointmentList from '../../components/appointments/AppointmentList';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [filterStatus, filterType]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.appointmentType = filterType;

      const response = await appointmentApi.getAll(params);
      setAppointments(response.data.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (appointment: any) => {
    setEditingAppointment(appointment);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await appointmentApi.delete(id);
      alert('ลบนัดหมายสำเร็จ');
      fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('เกิดข้อผิดพลาดในการลบนัดหมาย');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await appointmentApi.updateStatus(id, status);
      alert('อัพเดทสถานะสำเร็จ');
      fetchAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('เกิดข้อผิดพลาดในการอัพเดทสถานะ');
    }
  };

  const handleSuccess = () => {
    setShowModal(false);
    setEditingAppointment(null);
    fetchAppointments();
  };

  // สถิติ
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">นัดหมาย</h1>
          <p className="text-gray-600 mt-1">จัดการนัดหมายทั้งหมด</p>
        </div>
        <button
          onClick={() => {
            setEditingAppointment(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          สร้างนัดหมายใหม่
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">รอดำเนินการ</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <Calendar className="w-10 h-10 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">เสร็จสิ้น</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
            </div>
            <Calendar className="w-10 h-10 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ยกเลิก</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.cancelled}</p>
            </div>
            <Calendar className="w-10 h-10 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ทุกสถานะ</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="cancelled">ยกเลิก</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ทุกประเภท</option>
              <option value="installation">ติดตั้ง/ส่งมอบงาน</option>
              <option value="payment">รับชำระเงิน</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">กำลังโหลด...</p>
        </div>
      ) : (
        <AppointmentList
          appointments={appointments}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Appointment Modal */}
      {showModal && (
        <AppointmentModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingAppointment(null);
          }}
          onSuccess={handleSuccess}
          appointment={editingAppointment}
        />
      )}
    </div>
  );
};

export default AppointmentsPage;