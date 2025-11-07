import { Calendar, Clock, MapPin, User, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface Appointment {
  id: number;
  title: string;
  description?: string;
  appointmentDate: string;
  startTime?: string;
  endTime?: string;
  appointmentType: string;
  status: string;
  location?: string;
  contactPerson?: string;
  contactPhone?: string;
  invoice?: {
    invoiceNo: string;
    customerName: string;
  };
}

interface AppointmentListProps {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
}

const AppointmentList = ({ appointments, onEdit, onDelete, onStatusChange }: AppointmentListProps) => {
  const getTypeLabel = (type: string) => {
    const types: any = {
      installation: { label: 'ติดตั้ง', color: 'bg-blue-100 text-blue-800' },
      payment: { label: 'รับเงิน', color: 'bg-green-100 text-green-800' },
      other: { label: 'อื่นๆ', color: 'bg-gray-100 text-gray-800' }
    };
    return types[type] || types.other;
  };

  const getStatusBadge = (status: string) => {
    const statuses: any = {
      pending: { label: 'รอดำเนินการ', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-800' }
    };
    return statuses[status] || statuses.pending;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return '-';
    return time;
  };

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">ยังไม่มีนัดหมาย</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => {
        const typeInfo = getTypeLabel(appointment.appointmentType);
        const statusInfo = getStatusBadge(appointment.status);

        return (
          <div
            key={appointment.id}
            className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {appointment.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  {appointment.description && (
                    <p className="text-gray-600 text-sm">{appointment.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  {appointment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onStatusChange(appointment.id, 'completed')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="ทำเสร็จแล้ว"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onStatusChange(appointment.id, 'cancelled')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="ยกเลิก"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onEdit(appointment)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="แก้ไข"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('ต้องการลบนัดหมายนี้?')) {
                        onDelete(appointment.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="ลบ"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(appointment.appointmentDate)}</span>
                </div>

                {(appointment.startTime || appointment.endTime) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                    </span>
                  </div>
                )}

                {appointment.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{appointment.location}</span>
                  </div>
                )}

                {appointment.contactPerson && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{appointment.contactPerson}</span>
                    {appointment.contactPhone && (
                      <span className="text-gray-400">• {appointment.contactPhone}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Invoice Info */}
              {appointment.invoice && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    เกี่ยวข้องกับ:{' '}
                    <span className="font-medium text-gray-900">
                      {appointment.invoice.invoiceNo}
                    </span>
                    {' - '}
                    <span className="text-gray-700">{appointment.invoice.customerName}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AppointmentList;