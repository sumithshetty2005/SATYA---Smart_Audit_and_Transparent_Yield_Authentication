import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      return; // Graceful degrade
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 28;

    // --- 1. Golden Dust Particle Cloud ---
    const particleCount = 220;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const velocities: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      scales[i] = Math.random() * 2.5 + 0.5;
      velocities.push({
        x: (Math.random() - 0.5) * 0.005,
        y: Math.random() * 0.008 + 0.003,
        z: (Math.random() - 0.5) * 0.005,
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    // Particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 230, 140, 1)');
      grad.addColorStop(0.3, 'rgba(212, 175, 55, 0.6)');
      grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.65,
      map: particleTexture,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // --- 2. Sacred Geometry 3D Wireframe Mandala Group ---
    const mandalaGroup = new THREE.Group();
    mandalaGroup.position.set(0, 4, -4);

    // Outer Circle Ring
    const ringGeo1 = new THREE.RingGeometry(8.5, 8.56, 96);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xD4AF37,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const outerRing = new THREE.Mesh(ringGeo1, ringMat1);
    mandalaGroup.add(outerRing);

    // Secondary Ornamental Ring
    const ringGeo2 = new THREE.RingGeometry(5.8, 5.85, 72);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xC59B27,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const midRing = new THREE.Mesh(ringGeo2, ringMat2);
    mandalaGroup.add(midRing);

    // Inner Concentric Ring
    const ringGeo3 = new THREE.RingGeometry(3.2, 3.24, 64);
    const ringMat3 = new THREE.MeshBasicMaterial({
      color: 0x4A1504,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const innerRing = new THREE.Mesh(ringGeo3, ringMat3);
    mandalaGroup.add(innerRing);

    // 12-Pointed Sacred Star / Dodecagram Lines
    const starPoints: THREE.Vector3[] = [];
    const numPoints = 12;
    const rOuter = 8.5;
    const rInner = 5.8;

    for (let i = 0; i <= numPoints * 2; i++) {
      const angle = (i * Math.PI) / numPoints;
      const r = i % 2 === 0 ? rOuter : rInner;
      starPoints.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0));
    }

    const starGeo = new THREE.BufferGeometry().setFromPoints(starPoints);
    const starMat = new THREE.LineBasicMaterial({
      color: 0xD4AF37,
      transparent: true,
      opacity: 0.28,
    });
    const starMesh = new THREE.Line(starGeo, starMat);
    mandalaGroup.add(starMesh);

    // Nested Baudhayana Triangles (Sacred Sulba Geometry)
    const triangleGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const triPoints: THREE.Vector3[] = [
        new THREE.Vector3(0, 5.2, 0),
        new THREE.Vector3(4.5, -3.2, 0),
        new THREE.Vector3(-4.5, -3.2, 0),
        new THREE.Vector3(0, 5.2, 0),
      ];
      const triGeo = new THREE.BufferGeometry().setFromPoints(triPoints);
      const triMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0xD4AF37 : 0xC59B27,
        transparent: true,
        opacity: 0.25,
      });
      const tri = new THREE.Line(triGeo, triMat);
      tri.rotation.z = (i * Math.PI) / 4;
      triangleGroup.add(tri);
    }
    mandalaGroup.add(triangleGroup);

    scene.add(mandalaGroup);

    // --- 3. Interactive Mouse Raycast & Tilting ---
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Window Resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // --- 4. Animation Loop ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera and mandala mouse parallax
      targetX += (mouseX * 1.5 - targetX) * 0.04;
      targetY += (mouseY * 1.2 - targetY) * 0.04;

      mandalaGroup.rotation.z = elapsed * 0.04;
      triangleGroup.rotation.z = -elapsed * 0.06;
      mandalaGroup.rotation.x = targetY * 0.25;
      mandalaGroup.rotation.y = targetX * 0.3;

      // Update particle positions
      const pos = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3 + 1] += velocities[i].y * (1 + delta);
        pos[i * 3] += velocities[i].x;

        // Wrap around boundary
        if (pos[i * 3 + 1] > 22) {
          pos[i * 3 + 1] = -22;
          pos[i * 3] = (Math.random() - 0.5) * 50;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-85"
      aria-hidden="true"
    />
  );
};
