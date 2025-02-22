import React, { useState, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

////////////////////////////////////////////
// CROSS PRODUCT FOR MAGNUS EFFECT
////////////////////////////////////////////
function cross(ax, ay, az, bx, by, bz) {
  return [
    ay * bz - az * by,
    az * bx - ax * bz,
    ax * by - ay * bx,
  ];
}

////////////////////////////////////////////
// SHOT CATEGORIZATION
////////////////////////////////////////////
//
// 1) Start direction => face alone
//    face>+2 => Push (right), face<-2 => Pull (left).
//
// 2) Curvature => difference = pathDeg - faceDeg
//    if difference>+2 => Draw/Hook (curves left)
//    if difference<-2 => Fade/Slice (curves right)
//
// 3) Large spin => escalates fade->slice, draw->hook.
//
// 4) Arrows => angleRad= -(angleDeg*(π/180)) => +2 => arrow left, -2 => arrow right
//
function getShotCategory(faceDeg, pathDeg, sideSpinRpm) {
  // Set bigger thresholds to reduce “false positives.”
  const faceThreshold = 0.5;   // was 0
  const diffThreshold = 0.5;   // was 1
  const bigSpin = 2400;

  // 1) Start direction
  let startDir = "Straight";
  if (faceDeg > faceThreshold) {
    startDir = "Push";  // ball starts right if face > +1
  } else if (faceDeg < -faceThreshold) {
    startDir = "Pull";  // ball starts left if face < -1
  }

  // 2) Curvature
  let curve = "Straight";
  const diff = pathDeg - faceDeg;
  // e.g. if diff>+2 => left curve => “Draw” or “Hook”
  // if diff<-2 => right curve => “Fade” or “Slice”
  if (diff > diffThreshold) {
    // left curve
    if (Math.abs(sideSpinRpm) > bigSpin) curve = "Hook";
    else curve = "Draw";
  } else if (diff < -diffThreshold) {
    // right curve
    if (Math.abs(sideSpinRpm) > bigSpin) curve = "Slice";
    else curve = "Fade";
  }

  // 3) Combine
  if (startDir === "Straight" && curve === "Straight") {
    return "Straight";
  } else if (startDir === "Straight") {
    return curve;
  } else if (curve === "Straight") {
    return startDir;
  } else {
    return `${startDir}-${curve}`;
  }
}


export default function GolfShotVisualizer() {
  const [input, setInput] = useState({
    clubFace: 0,    // + => push, - => pull
    clubPath: 0,    // + => ???

    swingSpeed: 75,
    launchAngle: 19,
    pinYards: 150,
  });

  const [trajectory, setTrajectory] = useState([]);
  const [shotTaken, setShotTaken] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shotKey, setShotKey] = useState(0);
  const [carryDistance, setCarryDistance] = useState(0);
  const [sideSpinRpm, setSideSpinRpm] = useState(0);
  const [shotCategory, setShotCategory] = useState("Straight");

  // Convert yards -> meters
  const pinMeters = input.pinYards * 0.9144;

  const calculateBallFlight = () => {
    setTrajectory([]);
    setProgress(0);
    setShotTaken(false);
    setShotKey(prev => prev + 1);
    setCarryDistance(0);
    setShotCategory("Straight");

    const { clubFace, clubPath, swingSpeed, launchAngle } = input;

    // +clubFace => arrow left => angleRad=-(clubFace*(π/180))
    const faceRad = -(clubFace * Math.PI) / 180;
    const launchRad = (launchAngle * Math.PI) / 180;

    const mphToMs = 0.4704;
    const ballSpeedMs = swingSpeed * 1.4 * mphToMs;

    // initial velocity
    let vX = ballSpeedMs * Math.cos(launchRad) * Math.sin(faceRad);
    let vY = ballSpeedMs * Math.sin(launchRad);
    let vZ = ballSpeedMs * Math.cos(launchRad) * Math.cos(faceRad);

    // side spin => difference= path - face
    const degDiff = input.clubPath - input.clubFace;
    const side = degDiff * swingSpeed * 10;
    setSideSpinRpm(side);

    // shot shape
    const shotCat = getShotCategory(input.clubFace, input.clubPath, side);
    setShotCategory(shotCat);

    // spin
    const spinRadSec = side * (2 * Math.PI) / 60;
    const spinAxis = [0, spinRadSec, 0];

    // dt -> alters ball speed in visual
    const dt = 0.002;
    const gravity = -9.81;
    const maxTime = 8;
    let magnusConst = 0.0003;

    let posX = 0, posY = 0.1, posZ = 0;
    const points = [];

    for (let t = 0; t < maxTime; t += dt) {
      posX += vX * dt;
      posY += vY * dt;
      posZ += vZ * dt;

      vY += gravity * dt;

      // magnus
      const [mx, my, mz] = cross(spinAxis[0], spinAxis[1], spinAxis[2], vX, vY, vZ);
      vX += magnusConst * mx * dt;
      vY += magnusConst * my * dt;
      vZ += magnusConst * mz * dt;

      if (posY <= 0) {
        posY = 0;
        const carry = Math.sqrt(posX*posX + posZ*posZ) / 0.9144;
        setCarryDistance(carry);
        break;
      }
      points.push([posX, posY, posZ]);
    }
    setTrajectory(points);
    setShotTaken(true);
  };

  const handleChange = e => {
    setInput({ ...input, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "skyblue", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(255, 255, 255, 0)",
          padding: 10,
          borderRadius: 5,
          display: "flex",
          flexDirection: "column",
          gap: 5,
          zIndex: 10
        }}
      >
        <h2 style={{ margin:0 }}>Golf Shot Simulator</h2>
        <label>
          Club Face (°):{" "}
          <input
            type="number"
            name="clubFace"
            value={input.clubFace}
            onChange={handleChange}
          />
        </label>
        <label>
          Club Path (°):{" "}
          <input
            type="number"
            name="clubPath"
            value={input.clubPath}
            onChange={handleChange}
          />
        </label>
        <label>
          Swing Speed (mph):{" "}
          <input
            type="number"
            name="swingSpeed"
            value={input.swingSpeed}
            onChange={handleChange}
          />
        </label>
        <label>
          Launch Angle (°):{" "}
          <input
            type="number"
            name="launchAngle"
            value={input.launchAngle}
            onChange={handleChange}
          />
        </label>
        <label>
          Pin Distance (yds):{" "}
          <input
            type="number"
            name="pinYards"
            value={input.pinYards}
            onChange={handleChange}
          />
        </label>
        <button onClick={calculateBallFlight}>Hit Shot</button>
      </div>

      {shotTaken && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(255, 255, 255, 0)",
            padding:10,
            borderRadius:5,
            display:"flex",
            flexDirection:"column",
            gap:5,
            zIndex:10
          }}
        >
          <strong>Carry: {carryDistance.toFixed(1)} yds</strong>
          <strong>Shot: {shotCategory}</strong>
        </div>
        
      )}

      <Canvas
        style={{width:"100vw",height:"100vh"}}
        camera={{position:[0,1,-8], fov:65}}
        gl={{powerPreference:"high-performance"}}
      >
        <OrbitControls/>
        <ambientLight intensity={.6}/>
        <directionalLight position={[10,50,10]}/>

        <PathFaceArrows clubPath={input.clubPath} clubFace={input.clubFace}/>

        {/* Tee */}
        <mesh position={[0,0,0]}>
          <cylinderGeometry args={[0.3,0.3,0.05,12]}/>
          <meshStandardMaterial color="brown"/>
        </mesh>

        {shotTaken && <>
          <Ball trajectory={trajectory} progress={progress} setProgress={setProgress}/>
          <Tracer key={shotKey} trajectory={trajectory} shotTaken={shotTaken}/>
        </>}

        {/* narrower ground */}
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.1,195]}>
          <planeGeometry args={[50,410]}/>
          <meshStandardMaterial color="green" side={THREE.DoubleSide}/>
        </mesh>

        {/* green near pin */}
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.099,pinMeters]}>
          <circleGeometry args={[12,300]}/>
          <meshStandardMaterial color="darkgreen"/>
        </mesh>

        {/* bunker near pin */}
        <mesh rotation={[-Math.PI/2,0,0]} position={[-4,-0.098,pinMeters+3]}>
          <circleGeometry args={[2,32]}/>
          <meshStandardMaterial color="#d2b48c"/>
        </mesh>

        {/* pin */}
        <mesh position={[0,0,pinMeters]}>
          <cylinderGeometry args={[0.10,0.1,6,8]}/>
          <meshStandardMaterial color="white"/>
        </mesh>
        <mesh position={[0,1,pinMeters+0.05]} rotation={[0,Math.PI/2,0]}>
          <planeGeometry args={[1,0.5]}/>
          <meshStandardMaterial color="red" side={THREE.DoubleSide}/>
        </mesh>
      </Canvas>
    </div>
  );
}

function Ball({trajectory,progress,setProgress}){
  const ref = useRef();
  const SKIP=3;
  useFrame(()=>{
    if(trajectory.length>0 && ref.current && progress<trajectory.length-SKIP){
      setProgress(prev=>prev+SKIP);
      ref.current.position.set(...trajectory[progress]);
    }
  });
  return(
    <mesh ref={ref} position={[0,0.5,0]}>
      <sphereGeometry args={[0.2,64,64]}/>
      <meshStandardMaterial color="white"/>
    </mesh>
  );
}

function Tracer({trajectory,shotTaken}){
  if(!shotTaken||trajectory.length===0)return null;
  return(
    <line>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          array={new Float32Array(trajectory.flat())}
          count={trajectory.length}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial attach="material" color="red" linewidth={2}/>
    </line>
  );
}

function PathFaceArrows({clubPath,clubFace}){
  return(
    <group position={[0,0.2,0]}>
      <ArrowHelper angleDeg={clubPath} color="blue" label={`${clubPath.toFixed(1)}° path`} arrowOffset={0.5}/>
      <ArrowHelper angleDeg={clubFace} color="orange" label={`${clubFace.toFixed(1)}° face`} arrowOffset={-0.5}/>
    </group>
  );
}

function ArrowHelper({angleDeg,color,label,arrowOffset}){
  const ref=useRef();
  // invert angle => + => arrow left
  const angleRad=-(angleDeg*(Math.PI/180));

  const dir=useMemo(()=>{
    return new THREE.Vector3(Math.sin(angleRad),0,Math.cos(angleRad)).normalize();
  },[angleRad]);

  useFrame(()=>{
    if(ref.current){
      ref.current.setDirection(dir);
    }
  });

  const arrowObj=useMemo(()=>{
    return new THREE.ArrowHelper(dir,new THREE.Vector3(0,0,0),2,color,0.3,0.2);
  },[dir,color]);

  return(
    <group position={[arrowOffset,0,0]}>
      <primitive object={arrowObj}/>
      <Text
        position={[0,0.15,0]}
        rotation={[0,Math.PI,0]}
        fontSize={0.2}
        color={color}
        anchorX="center"
        anchorY="bottom"
      >
        {label}
      </Text>
    </group>
  );
}
