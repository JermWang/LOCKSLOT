"use client"

import { useEffect, useRef } from "react"

export function GeometricBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener("resize", resize)

    // Mathematical constants
    const PHI = 1.618033988749895 // Golden ratio
    const TAU = Math.PI * 2

    // Particle system for floating math symbols
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      symbol: string
      size: number
      opacity: number
      rotation: number
      rotationSpeed: number
    }> = []

    const mathSymbols = ["∑", "∏", "∫", "∂", "∇", "∞", "φ", "π", "Ω", "λ", "Δ", "θ", "σ", "μ"]

    // Initialize particles
    for (let i = 0; i < 25; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        symbol: mathSymbols[Math.floor(Math.random() * mathSymbols.length)],
        size: 12 + Math.random() * 20,
        opacity: 0.03 + Math.random() * 0.06,
        rotation: Math.random() * TAU,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
      })
    }

    // Draw a single geometric node
    const drawNode = (x: number, y: number, radius: number, opacity: number) => {
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, TAU)
      ctx.fillStyle = `rgba(74, 222, 128, ${opacity})`
      ctx.fill()
    }

    // Draw connecting line
    const drawConnection = (x1: number, y1: number, x2: number, y2: number, opacity: number) => {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = `rgba(74, 222, 128, ${opacity})`
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Lissajous curve points
    const lissajousPoints: Array<{ x: number; y: number }> = []

    const animate = () => {
      time += 0.005
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      // Draw flowing Lissajous curves
      ctx.beginPath()
      const a = 3
      const b = 4
      const scale = Math.min(canvas.width, canvas.height) * 0.3
      
      for (let t = 0; t < TAU; t += 0.01) {
        const x = centerX + Math.sin(a * t + time) * scale
        const y = centerY + Math.sin(b * t) * scale
        
        if (t === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()
      ctx.strokeStyle = "rgba(74, 222, 128, 0.04)"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw secondary curve (phase shifted)
      ctx.beginPath()
      for (let t = 0; t < TAU; t += 0.01) {
        const x = centerX + Math.sin(a * t + time * 0.7 + Math.PI / 3) * scale * 0.8
        const y = centerY + Math.cos(b * t + time * 0.5) * scale * 0.8
        
        if (t === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()
      ctx.strokeStyle = "rgba(74, 222, 128, 0.025)"
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Draw sacred geometry - rotating hexagon with inner connections
      const hexRadius = Math.min(canvas.width, canvas.height) * 0.25
      const hexPoints: Array<{ x: number; y: number }> = []
      
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * TAU + time * 0.2
        hexPoints.push({
          x: centerX + Math.cos(angle) * hexRadius,
          y: centerY + Math.sin(angle) * hexRadius,
        })
      }

      // Draw hexagon outline
      ctx.beginPath()
      hexPoints.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      })
      ctx.closePath()
      ctx.strokeStyle = "rgba(74, 222, 128, 0.05)"
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw inner star connections
      for (let i = 0; i < 6; i++) {
        const next = (i + 2) % 6
        drawConnection(hexPoints[i].x, hexPoints[i].y, hexPoints[next].x, hexPoints[next].y, 0.03)
      }

      // Draw nodes at hex vertices
      hexPoints.forEach((p) => {
        drawNode(p.x, p.y, 3, 0.08)
      })

      // Orbiting golden spiral dots
      const spiralArms = 3
      for (let arm = 0; arm < spiralArms; arm++) {
        const armOffset = (arm / spiralArms) * TAU
        for (let i = 0; i < 20; i++) {
          const t = i * 0.15
          const r = Math.pow(PHI, t) * 8
          const angle = t * PHI * TAU + time * 0.3 + armOffset
          const x = centerX + Math.cos(angle) * r
          const y = centerY + Math.sin(angle) * r
          const opacity = Math.max(0, 0.1 - i * 0.004)
          drawNode(x, y, 1.5, opacity)
        }
      }

      // Floating math symbols
      ctx.font = "bold serif"
      particles.forEach((p) => {
        // Update position
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed

        // Wrap around edges
        if (p.x < -50) p.x = canvas.width + 50
        if (p.x > canvas.width + 50) p.x = -50
        if (p.y < -50) p.y = canvas.height + 50
        if (p.y > canvas.height + 50) p.y = -50

        // Draw symbol
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.font = `${p.size}px serif`
        ctx.fillStyle = `rgba(74, 222, 128, ${p.opacity})`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(p.symbol, 0, 0)
        ctx.restore()
      })

      // Corner accents - fibonacci spiral hints
      const corners = [
        { x: 0, y: 0, angle: 0 },
        { x: canvas.width, y: 0, angle: Math.PI / 2 },
        { x: canvas.width, y: canvas.height, angle: Math.PI },
        { x: 0, y: canvas.height, angle: -Math.PI / 2 },
      ]

      corners.forEach((corner) => {
        ctx.save()
        ctx.translate(corner.x, corner.y)
        ctx.rotate(corner.angle)
        
        // Draw quarter spiral
        ctx.beginPath()
        for (let t = 0; t < 3; t += 0.05) {
          const r = Math.pow(PHI, t) * 15
          const a = t * 0.5 + time * 0.2
          const x = Math.cos(a) * r
          const y = Math.sin(a) * r
          if (t === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = "rgba(74, 222, 128, 0.06)"
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()
      })

      // Subtle grid of dots using prime number spacing
      const gridSpacing = 89 // Fibonacci number
      for (let x = gridSpacing / 2; x < canvas.width; x += gridSpacing) {
        for (let y = gridSpacing / 2; y < canvas.height; y += gridSpacing) {
          const pulse = Math.sin(time + x * 0.01 + y * 0.01) * 0.5 + 0.5
          drawNode(x, y, 1, 0.02 + pulse * 0.02)
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
