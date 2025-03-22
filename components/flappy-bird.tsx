import React, { useState, useEffect, useRef } from "react"

/**
 * A React component that implements the “Flappy Bird: 3D Edition”
 * logic from your HTML/JS example, using a <canvas> for rendering.
 */
export default function FlappyBird3D() {
  // -------------------------------------------------------
  // References and State
  // -------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Game states
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  // Bird
  const [bird, setBird] = useState({
    x: 50,
    y: 200,
    velocity: 0,
    gravity: 0.25,
    jump: -6,
    width: 40,
    height: 30,
    rotation: 0,
  })

  // Pipes
  const [pipes, setPipes] = useState<
    { x: number; top: number; bottom: number; passed: boolean }[]
  >([])

  const pipeWidth = 70
  const pipeGap = 150

  // Clouds
  const [clouds, setClouds] = useState<
    { x: number; y: number; width: number; height: number; speed: number }[]
  >([])

  // Score
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)

  // -------------------------------------------------------
  // Lifecycle Effects
  // -------------------------------------------------------

  // 1) Main game loop using requestAnimationFrame
  useEffect(() => {
    let animationId: number

    function gameLoop() {
      updateGame()
      drawGame()
      animationId = requestAnimationFrame(gameLoop)
    }

    // Start the loop
    animationId = requestAnimationFrame(gameLoop)

    // Cleanup
    return () => cancelAnimationFrame(animationId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2) Keydown listener for arrow up / space
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "ArrowUp" || e.code === "Space") {
        if (!gameStarted) {
          setGameStarted(true)
        } else if (!gameOver) {
          jump()
        } else {
          // If game is over and user presses space/up, restart
          resetGame()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameStarted, gameOver])

  // -------------------------------------------------------
  // Game Logic
  // -------------------------------------------------------

  function startGame() {
    if (!gameStarted) {
      setGameStarted(true)
    }
  }

  function resetGame() {
    // Reset bird
    setBird((b) => ({
      ...b,
      x: 50,
      y: 200,
      velocity: 0,
      rotation: 0,
    }))
    // Reset pipes
    setPipes([])
    // Reset clouds
    setClouds([createCloud(), createCloud(), createCloud()])
    // Reset score
    setScore(0)
    // Reset game states
    setGameOver(false)
    setGameStarted(true)
  }

  function jump() {
    if (gameStarted && !gameOver) {
      setBird((prev) => ({ ...prev, velocity: prev.jump }))
    }
  }

  function createCloud() {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0, width: 0, height: 0, speed: 0 }

    return {
      x: canvas.width,
      y: Math.random() * (canvas.height / 2),
      width: Math.random() * 60 + 40,
      height: Math.random() * 40 + 20,
      speed: Math.random() * 0.5 + 0.1,
    }
  }

  function updateGame() {
    // If the game isn’t started or is over, no movement
    if (!gameStarted || gameOver) return

    setBird((prevBird) => {
      const newVelocity = prevBird.velocity + prevBird.gravity
      const newY = prevBird.y + newVelocity
      let newRotation = Math.min(Math.PI / 2, Math.max(-Math.PI / 2, newVelocity * 0.1))

      // Check if bird hits top/bottom
      let isGameOver = false
      if (newY + prevBird.height >= getCanvasHeight() || newY < 0) {
        isGameOver = true
      }

      if (isGameOver) {
        setGameOver(true)
      }

      return {
        ...prevBird,
        velocity: newVelocity,
        y: newY,
        rotation: newRotation,
      }
    })

    // Update pipes
    setPipes((oldPipes) => {
      let newPipes = oldPipes.map((pipe) => ({ ...pipe, x: pipe.x - 2 }))
      newPipes.forEach((pipe) => {
        // Check collision
        const b = bird
        if (b.x + b.width > pipe.x && b.x < pipe.x + pipeWidth) {
          if (b.y < pipe.top || b.y + b.height > pipe.bottom) {
            setGameOver(true)
          }
        }

        // If the bird has passed the pipe's center
        if (pipe.x + pipeWidth < b.x && !pipe.passed) {
          pipe.passed = true
          setScore((s) => s + 1)
        }
      })
      // Filter out off-screen pipes
      newPipes = newPipes.filter((pipe) => pipe.x + pipeWidth > 0)

      // Add new pipe if needed
      if (
        newPipes.length === 0 ||
        newPipes[newPipes.length - 1].x < getCanvasWidth() - 200
      ) {
        let pipeY = Math.random() * (getCanvasHeight() - pipeGap - 100) + 50
        newPipes.push({
          x: getCanvasWidth(),
          top: pipeY,
          bottom: pipeY + pipeGap,
          passed: false,
        })
      }

      return newPipes
    })

    // Update clouds
    setClouds((oldClouds) => {
      let newClouds = oldClouds.map((c) => ({ ...c, x: c.x - c.speed }))
      newClouds = newClouds.filter((c) => c.x + c.width > 0)

      // Possibly add new clouds
      if (newClouds.length < 3) {
        newClouds.push(createCloud())
      }
      return newClouds
    })

    // Update high score if needed
    if (gameOver && score > highScore) {
      setHighScore(score)
    }
  }

  function drawGame() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear the canvas each frame
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    drawBackground(ctx)

    // Draw pipes
    pipes.forEach((pipe) => {
      drawPipe(ctx, pipe.x, pipe.top, true)
      drawPipe(ctx, pipe.x, pipe.bottom, false)
    })

    // Draw bird
    drawBird(ctx, bird)

    // Draw score
    ctx.fillStyle = "black"
    ctx.font = "24px Arial"
    ctx.fillText(`Score: ${score}`, 10, 30)

    // Overlays
    if (!gameStarted) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "white"
      ctx.font = "24px Arial"
      ctx.fillText("Click or Press Space to Start", 50, canvas.height / 2)
    } else if (gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "white"
      ctx.font = "48px Arial"
      ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2)
      ctx.font = "24px Arial"
      ctx.fillText("Click or Press Space to Restart", 40, canvas.height / 2 + 40)
    }

    // Draw clouds on top
    drawClouds(ctx)
  }

  // -------------------------------------------------------
  // Drawing Helpers
  // -------------------------------------------------------
  function getCanvasWidth() {
    return canvasRef.current?.width || 400
  }

  function getCanvasHeight() {
    return canvasRef.current?.height || 400
  }

  function drawBackground(ctx: CanvasRenderingContext2D) {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, getCanvasHeight())
    gradient.addColorStop(0, "#87CEEB")
    gradient.addColorStop(1, "#E0F6FF")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, getCanvasWidth(), getCanvasHeight())
  }

  function drawClouds(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
    clouds.forEach((cloud) => {
      ctx.beginPath()
      ctx.arc(cloud.x, cloud.y, cloud.width / 2, Math.PI * 0.5, Math.PI * 1.5)
      ctx.arc(
        cloud.x + cloud.width / 2,
        cloud.y - cloud.height / 2,
        cloud.height / 2,
        Math.PI * 1,
        Math.PI * 2
      )
      ctx.arc(
        cloud.x + cloud.width,
        cloud.y,
        cloud.width / 2,
        Math.PI * 1.5,
        Math.PI * 0.5
      )
      ctx.arc(
        cloud.x + cloud.width / 2,
        cloud.y + cloud.height / 2,
        cloud.height / 2,
        0,
        Math.PI
      )
      ctx.fill()
    })
  }

  function drawBird(ctx: CanvasRenderingContext2D, b: typeof bird) {
    ctx.save()
    ctx.translate(b.x + b.width / 2, b.y + b.height / 2)
    ctx.rotate(b.rotation)

    // Body gradient
    const bodyGradient = ctx.createRadialGradient(0, 0, 5, -5, -5, 25)
    bodyGradient.addColorStop(0, "#FFD700")
    bodyGradient.addColorStop(1, "#FFA500")
    ctx.fillStyle = bodyGradient

    // Body
    ctx.beginPath()
    ctx.ellipse(0, 0, b.width / 2, b.height / 2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Wing
    ctx.fillStyle = "#FF8C00"
    ctx.beginPath()
    ctx.moveTo(-5, 0)
    ctx.quadraticCurveTo(-15, -10, -25, 0)
    ctx.quadraticCurveTo(-15, 10, -5, 0)
    ctx.fill()

    // Eye
    ctx.fillStyle = "white"
    ctx.beginPath()
    ctx.arc(10, -5, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "black"
    ctx.beginPath()
    ctx.arc(12, -5, 2, 0, Math.PI * 2)
    ctx.fill()

    // Beak
    const beakGradient = ctx.createLinearGradient(15, -2, 25, 2)
    beakGradient.addColorStop(0, "#FF6347")
    beakGradient.addColorStop(1, "#FF4500")
    ctx.fillStyle = beakGradient
    ctx.beginPath()
    ctx.moveTo(15, -2)
    ctx.lineTo(25, 0)
    ctx.lineTo(15, 2)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  function drawPipe(ctx: CanvasRenderingContext2D, x: number, height: number, isTop: boolean) {
    const pipeHeight = isTop ? height : getCanvasHeight() - height
    const pipeY = isTop ? 0 : height

    // Main pipe
    ctx.fillStyle = "#00AA00"
    ctx.fillRect(x, pipeY, pipeWidth, pipeHeight)

    ctx.strokeStyle = "#007700"
    ctx.lineWidth = 4
    ctx.strokeRect(x, pipeY, pipeWidth, pipeHeight)

    // Top lip
    const topWidth = pipeWidth + 10
    const topHeight = 20
    const topX = x - 5
    const topY = isTop ? height - topHeight : height

    ctx.fillStyle = "#00AA00"
    ctx.fillRect(topX, topY, topWidth, topHeight)

    ctx.strokeStyle = "#007700"
    ctx.lineWidth = 4
    ctx.strokeRect(topX, topY, topWidth, topHeight)

    ctx.fillStyle = "#00CC00"
    ctx.fillRect(x + 10, pipeY, 10, pipeHeight)
  }

  // -------------------------------------------------------
  // Canvas sizing + event handlers
  // -------------------------------------------------------

  // Make the canvas responsive by matching its display size
  // to its container's clientWidth. We keep a 1:1 aspect ratio.
  // Adjust if you want a different ratio.
  useEffect(() => {
    function handleResize() {
      const canvas = canvasRef.current
      if (!canvas) return
      const parent = canvas.parentElement
      if (!parent) return

      // We'll make the canvas the smaller of (parent's width, parent’s height)
      // or fallback to 400 if not found
      const size = Math.min(parent.clientWidth, 400)
      canvas.width = size
      canvas.height = size
    }
    window.addEventListener("resize", handleResize)
    handleResize() // initial
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Click on canvas to jump or start/restart
  function handleCanvasClick() {
    if (!gameStarted) {
      setGameStarted(true)
    } else if (gameOver) {
      resetGame()
    } else {
      jump()
    }
  }

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------
  return (
    <div style={styles.pageContainer}>
      <div style={styles.gameContainer}>
        <h1 style={styles.title}>Flappy Bird: 3D Edition</h1>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
          onClick={handleCanvasClick}
        />
        <div id="instructions" style={styles.instructions}>
          Use the up arrow key, spacebar, or click to make the bird fly.
        </div>
        <div id="game-stats" style={styles.gameStats}>
          High Score: <span style={styles.scoreValue}>{highScore}</span> | Current Score:{" "}
          <span style={styles.scoreValue}>{score}</span>
        </div>
        <div style={styles.controls}>
          <button style={styles.btn} onClick={startGame}>
            Start Game
          </button>
          <button style={styles.btn} onClick={resetGame}>
            Restart
          </button>
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------
// Inline styles for convenience. Feel free to move these
// into a CSS/SCSS file or a styled-components approach.
// -------------------------------------------------------
const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    margin: 0,
    padding: 0,
    fontFamily: "Arial, sans-serif",
    background: "linear-gradient(to bottom, #87CEEB, #E0F6FF)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
  },
  gameContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
    boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)",
    padding: 20,
    textAlign: "center",
    maxWidth: 500,
    width: "90%", // responsive
    margin: "auto",
  },
  title: {
    color: "#FF6347",
    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.1)",
    marginBottom: 20,
  },
  canvas: {
    border: "1px solid #FFD700",
    borderRadius: 10,
    boxShadow: "0 0 10px rgba(255, 215, 0, 0.3)",
    width: "100%",  // fill the container
    height: "auto",  // keep aspect ratio
    display: "block",
    margin: "0 auto",
  },
  instructions: {
    marginTop: 20,
    color: "#333",
  },
  gameStats: {
    marginTop: 20,
    color: "#333",
  },
  scoreValue: {
    fontWeight: "bold",
    color: "#FF6347",
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
  },
  btn: {
    backgroundColor: "#FFD700",
    border: "none",
    color: "#333",
    padding: "10px 20px",
    borderRadius: 5,
    cursor: "pointer",
    transition: "background-color 0.3s",
    fontSize: 16,
  },
}

