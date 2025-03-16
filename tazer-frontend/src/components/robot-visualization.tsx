"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import { Group, PointLight } from "three"

// Robot model component
function RobotModel({ motorValues, tazerActive }: { motorValues: { left: number, right: number }, tazerActive: boolean }) {
  const group = useRef<Group>(null)
  // In a real implementation, you would load your robot model
  // For this example, we'll create a simple robot with primitive shapes

  // Animate the wheels based on motor values
  useFrame((state, delta) => {
    if (group.current) {
      // Left wheel rotation based on left motor value
      group.current.children[1].rotation.x += motorValues.left * delta * 0.1

      // Right wheel rotation based on right motor value
      group.current.children[2].rotation.x += motorValues.right * delta * 0.1

      // Tazer effect (pulsing light)
      if (tazerActive && group.current.children[4]) {
        const tazerLight = group.current.children[4] as PointLight
        tazerLight.intensity = 5 + Math.sin(state.clock.elapsedTime * 10) * 3
      } else if (group.current.children[4]) {
        (group.current.children[4] as PointLight).intensity = 0
      }
    }
  })

  return (
    <group ref={group}>
      {/* Robot body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2, 0.5, 3]} />
        <meshStandardMaterial color="#444" />
      </mesh>

      {/* Left wheel */}
      <mesh position={[-1.1, 0, -0.8]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 32]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Right wheel */}
      <mesh position={[1.1, 0, -0.8]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 32]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Tazer component */}
      <mesh position={[0, 0.8, 1.2]} castShadow>
        <boxGeometry args={[0.5, 0.3, 0.5]} />
        <meshStandardMaterial
          color={tazerActive ? "#ff0000" : "#550000"}
          emissive={tazerActive ? "#ff0000" : "#000000"}
          emissiveIntensity={tazerActive ? 2 : 0}
        />
      </mesh>

      {/* Tazer light */}
      <pointLight position={[0, 1, 1.2]} color="#ff0000" intensity={0} distance={3} decay={2} />
    </group>
  )
}

// Ground plane
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.5, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#999" />
    </mesh>
  )
}

export default function RobotVisualization({ 
  motorValues, 
  tazerActive 
}: { 
  motorValues: { left: number; right: number }; 
  tazerActive: boolean;
}) {
  return (
    <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <RobotModel motorValues={motorValues} tazerActive={tazerActive} />
      <Ground />
      <OrbitControls />
      <Environment preset="warehouse" />
    </Canvas>
  )
}

