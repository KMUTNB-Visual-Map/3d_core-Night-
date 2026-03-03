import React, { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useNavStore } from '../store/useNavStore';

// 🟢 Component ย่อย: จัดการโหลดโมเดลและแอนิเมชัน
function AvatarModel({ type }) {
  const { userPosition, isFollowing } = useNavStore();
  const group = useRef(null); // ไร้คราบ TypeScript แน่นอนครับ

  // 1. โหลดไฟล์ 3D ทั้งหมด (เพิ่มไฟล์เดินของผู้ชายแล้ว)
  const femaleIdle = useGLTF('/models/women_idle.glb');
  const femaleWalk = useGLTF('/models/women_idle.glb'); 
  const maleIdle = useGLTF('/models/men_idle.glb'); 
  const maleWalk = useGLTF('/models/men_idle.glb'); // ✅ ของนักเรียนชาย

  // 2. เลือกไฟล์ตามเพศ และสถานะการเดิน
  let currentModel = femaleIdle; 
  if (type === 'female') {
    currentModel = isFollowing ? femaleWalk : femaleIdle;
  } else if (type === 'male') {
    currentModel = isFollowing ? maleWalk : maleIdle; // ✅ ใส่เงื่อนไขเดินให้ผู้ชายแล้ว
  }

  // 3. Hook ดึงแอนิเมชัน
  const { actions, names } = useAnimations(currentModel.animations, group);

  useEffect(() => {
    if (names.length === 0) return;
    
    const actionName = names[0]; 
    const action = actions[actionName];
    
    // สั่งให้เล่นท่าทาง พร้อมเฟดอิน 0.2 วินาทีให้ดูเนียนตา
    action?.reset().fadeIn(0.2).play();

    return () => {
      action?.fadeOut(0.2);
    };
  }, [actions, names, currentModel]);

  return (
    <group ref={group} position={userPosition} scale={[1, 1, 1]}>
      {/* ใส่ key บังคับโหลดใหม่เวลาสลับโมเดล ป้องกันการซ้อนทับ */}
      <primitive object={currentModel.scene} key={currentModel.scene.uuid} />
    </group>
  );
}

// 🟢 Component หลัก: ประตูยามดักเงื่อนไข
export default function Avatar() {
  const { avatarType } = useNavStore();

  // ถ้าผู้ใช้ยังไม่ได้เลือก Avatar ใน Pop-up ก็จบงานเลย ไม่ต้องโหลด 3D
  if (!avatarType) return null;

  // ถ้าเลือกแล้ว ค่อยเรียก Component ตัวย่อยขึ้นมาทำงาน
  return <AvatarModel type={avatarType} />;
}

// โหลดไฟล์เตรียมไว้ล่วงหน้าทั้งหมด จะได้ไม่กระตุกตอนสลับท่า
useGLTF.preload('/models/women_idle.glb');
useGLTF.preload('/models/women_idle.glb');
useGLTF.preload('/models/men_idle.glb');
useGLTF.preload('/models/men_idle.glb'); // ✅ พรีโหลดท่าเดินชาย