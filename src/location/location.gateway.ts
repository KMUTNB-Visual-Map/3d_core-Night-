import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GuestService } from './guest.service'; // นำเข้า Service ที่เราเขียนไว้

// ตั้งค่า Gateway (เปิด CORS ให้ Frontend ต่อเข้ามาได้)
@WebSocketGateway({
  cors: {
    origin: '*', // ตอน Deploy จริงควรเปลี่ยนเป็น URL ของ Frontend
  },
  namespace: '/location', // กำหนด Endpoint (เช่น ws://localhost:3000/location)
})
export class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Inject GuestService เข้ามาใช้งาน
  constructor(private readonly guestService: GuestService) {}

  // --------------------------------------------------------
  // 1. Event: เมื่อมี Client เชื่อมต่อเข้ามา (Connect)
  // --------------------------------------------------------
  handleConnection(client: Socket) {
    console.log(`🟢 Client connected: ${client.id}`);
    
    // ทริค: อาจจะให้ Client ส่ง guest_id มาตอนต่อ Socket เพื่อ Verify เลยก็ได้
    // const guestId = client.handshake.query.guest_id;
  }

  // --------------------------------------------------------
  // 2. Event: เมื่อ Client หลุดการเชื่อมต่อ (Disconnect)
  // --------------------------------------------------------
  handleDisconnect(client: Socket) {
    console.log(`🔴 Client disconnected: ${client.id}`);
  }

  // --------------------------------------------------------
  // 3. Event: รับพิกัด GPS และ Calibration จาก Frontend
  // --------------------------------------------------------
  @SubscribeMessage('sync_location')
  async handleSyncLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any, // รับ Data ที่ส่งมาจาก Frontend
  ) {
    try {
      console.log(`📍 Received location from ${client.id}:`, payload);

      // 1. ตรวจสอบ/สร้าง Guest (ถ้ายังไม่มี)
      await this.guestService.verifyGuest(payload.guest_id);

      // 2. บันทึกข้อมูล GPS ลง Database
      await this.guestService.saveCalibrationData(payload);

      // 3. (Optional) ส่งข้อมูลที่อัปเดตกลับไปหาทุกคนในแผนที่ (Broadcasting)
      // this.server.emit('update_map', { guest_id: payload.guest_id, gps: payload.gps });

      return { status: 'success', message: 'Location synced' }; // ตอบกลับคนส่ง
      
    } catch (error) {
      console.error(`❌ Error syncing location:`, error.message);
      return { status: 'error', message: error.message };
    }
  }
}
