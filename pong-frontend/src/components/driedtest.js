import { Canvas } from '@react-three/fiber';
import { MeshWobbleMaterial, OrbitControls } from '@react-three/drei';

const Pong3D = () => {
  return (
    <Canvas>
      <ambientLight intensity={1} />
      <spotLight position={[10, 10, 10]} angle={0.15} />
      <mesh position={[-1, 0, 0]}>
        <boxGeometry args={[1, 4, 1]} />
        <MeshWobbleMaterial color="hotpink" speed={1} />
      </mesh>
      <mesh position={[1, 0, 0]}>
        <boxGeometry args={[1, 4, 1]} />
        <MeshWobbleMaterial color="skyblue" speed={1} />
      </mesh>
      <OrbitControls />
    </Canvas>
  );
};

export default Pong3D;
