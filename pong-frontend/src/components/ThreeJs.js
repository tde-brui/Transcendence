import React from "react";
import { Canvas } from "@react-three/fiber";
import { Text } from "@react-three/drei";

function ThreeDText() {
  return (
    <Canvas>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 0, 5]} />

      {/* 3D Text */}
      <Text
        position={[0, 0, 0]} // Position of the text in the 3D space
        fontSize={10} // Size of the text
        color="white" // Color of the text
        anchorX="center" // Center the text horizontally
        anchorY="middle" // Center the text vertically
      >
        Pong
      </Text>
    </Canvas>
  );
}

export default ThreeDText;
