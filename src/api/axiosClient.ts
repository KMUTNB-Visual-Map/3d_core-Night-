import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'https://api-kmutnb-nav.com', // เปลี่ยนเป็น URL ของ Backend ทีมอื่น
});

axiosClient.interceptors.request.use((config) => {
  const guestId = localStorage.getItem('x-guest-id');
  if (guestId) {
    config.headers['x-guest-id'] = guestId;
  }
  return config;
});

export default axiosClient;