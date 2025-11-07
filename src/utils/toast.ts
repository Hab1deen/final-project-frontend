export const toast = {
  success: (message: string) => {
    // ใช้ alert ธรรมดาก่อน (หรือติดตั้ง react-hot-toast)
    alert(`✅ ${message}`);
  },
  error: (message: string) => {
    alert(`❌ ${message}`);
  },
  info: (message: string) => {
    alert(`ℹ️ ${message}`);
  },
  warning: (message: string) => {
    alert(`⚠️ ${message}`);
  }
};