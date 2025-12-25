"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  targetX: number;
  targetY: number;
  speed: number;
  trail: { x: number; y: number }[];
}

interface Node {
  x: number;
  y: number;
  radius: number;
  pulsePhase: number;
  connections: number[];
}

interface LiveNetworkPulseProps {
  nodeCount?: number;
  healthScore?: number;
  isLive?: boolean;
  className?: string;
}

export function LiveNetworkPulse({
  nodeCount = 214,
  healthScore = 90,
  isLive = true,
  className,
}: LiveNetworkPulseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Colors based on health score
  const getHealthColor = useCallback(
    (alpha: number = 1) => {
      if (healthScore >= 90) return `rgba(34, 197, 94, ${alpha})`; // Green
      if (healthScore >= 70) return `rgba(234, 179, 8, ${alpha})`; // Yellow
      return `rgba(239, 68, 68, ${alpha})`; // Red
    },
    [healthScore]
  );

  const getAccentColor = useCallback((alpha: number = 1) => {
    return `rgba(14, 165, 233, ${alpha})`; // Cyan accent
  }, []);

  // Initialize nodes in a distributed pattern
  const initializeNodes = useCallback(
    (width: number, height: number) => {
      const nodes: Node[] = [];
      const nodeCountDisplay = Math.min(Math.floor(nodeCount / 10), 25); // Scale down for display
      const padding = 60;

      for (let i = 0; i < nodeCountDisplay; i++) {
        const angle = (i / nodeCountDisplay) * Math.PI * 2;
        const radiusOffset = 0.3 + Math.random() * 0.4;
        const x =
          width / 2 +
          Math.cos(angle) * (width / 2 - padding) * radiusOffset +
          (Math.random() - 0.5) * 40;
        const y =
          height / 2 +
          Math.sin(angle) * (height / 2 - padding) * radiusOffset +
          (Math.random() - 0.5) * 40;

        // Create connections to nearby nodes
        const connections: number[] = [];
        for (let j = 0; j < i; j++) {
          const dx = x - nodes[j].x;
          const dy = y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 150 && Math.random() > 0.5) {
            connections.push(j);
          }
        }

        nodes.push({
          x,
          y,
          radius: 3 + Math.random() * 2,
          pulsePhase: Math.random() * Math.PI * 2,
          connections,
        });
      }

      nodesRef.current = nodes;
    },
    [nodeCount]
  );

  // Initialize particles
  const initializeParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      const sourceNode =
        nodesRef.current[Math.floor(Math.random() * nodesRef.current.length)];
      const targetNode =
        nodesRef.current[Math.floor(Math.random() * nodesRef.current.length)];

      if (sourceNode && targetNode) {
        particles.push({
          x: sourceNode.x,
          y: sourceNode.y,
          vx: 0,
          vy: 0,
          radius: 1.5 + Math.random(),
          alpha: 0.6 + Math.random() * 0.4,
          targetX: targetNode.x,
          targetY: targetNode.y,
          speed: 0.5 + Math.random() * 1.5,
          trail: [],
        });
      }
    }

    particlesRef.current = particles;
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const time = Date.now() * 0.001;

    // Clear with fade effect for trails
    ctx.fillStyle = "rgba(10, 15, 25, 0.15)";
    ctx.fillRect(0, 0, width, height);

    // Draw connections
    ctx.strokeStyle = getHealthColor(0.1);
    ctx.lineWidth = 1;
    nodesRef.current.forEach((node) => {
      node.connections.forEach((connIndex) => {
        const connNode = nodesRef.current[connIndex];
        if (connNode) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(connNode.x, connNode.y);
          ctx.stroke();
        }
      });
    });

    // Draw and update nodes
    nodesRef.current.forEach((node, index) => {
      const pulse = Math.sin(time * 2 + node.pulsePhase) * 0.5 + 0.5;
      const radius = node.radius + pulse * 2;

      // Glow effect
      const gradient = ctx.createRadialGradient(
        node.x,
        node.y,
        0,
        node.x,
        node.y,
        radius * 4
      );
      gradient.addColorStop(0, getHealthColor(0.3 + pulse * 0.2));
      gradient.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 4, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = getHealthColor(0.8);
      ctx.fill();
    });

    // Update and draw particles
    if (isLive) {
      particlesRef.current.forEach((particle, index) => {
        // Move towards target
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
          // Pick new target
          const newTarget =
            nodesRef.current[
              Math.floor(Math.random() * nodesRef.current.length)
            ];
          if (newTarget) {
            particle.targetX = newTarget.x;
            particle.targetY = newTarget.y;
          }
        } else {
          particle.x += (dx / distance) * particle.speed;
          particle.y += (dy / distance) * particle.speed;
        }

        // Store trail
        particle.trail.push({ x: particle.x, y: particle.y });
        if (particle.trail.length > 10) {
          particle.trail.shift();
        }

        // Draw trail
        if (particle.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
          particle.trail.forEach((point, i) => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.strokeStyle = getAccentColor(0.3);
          ctx.lineWidth = particle.radius * 0.5;
          ctx.stroke();
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = getAccentColor(particle.alpha);
        ctx.fill();
      });
    }

    // Central pulse effect
    const centralPulse = Math.sin(time * 1.5) * 0.3 + 0.7;
    const centralGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.min(width, height) * 0.4
    );
    centralGradient.addColorStop(0, getHealthColor(0.05 * centralPulse));
    centralGradient.addColorStop(0.5, getHealthColor(0.02 * centralPulse));
    centralGradient.addColorStop(1, "transparent");

    ctx.beginPath();
    ctx.arc(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.4,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = centralGradient;
    ctx.fill();

    animationRef.current = requestAnimationFrame(animate);
  }, [getHealthColor, getAccentColor, isLive]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const parent = canvas.parentElement;
      if (!parent) return;

      const { width, height } = parent.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      setDimensions({ width, height });

      initializeNodes(width, height);
      initializeParticles(width, height);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [initializeNodes, initializeParticles]);

  // Start animation
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, dimensions]);

  return (
    <div
      className={cn(
        "relative w-full h-64 md:h-80 overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-background via-card to-background",
        "border border-border/50",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: "transparent" }}
      />

      {/* Overlay info */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              isLive ? "bg-primary animate-live-dot" : "bg-muted"
            )}
          />
          <span className="text-xs font-medium text-muted-foreground">
            {isLive ? "Live Network Activity" : "Paused"}
          </span>
        </div>
      </div>

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-transparent" />
      </div>
    </div>
  );
}
