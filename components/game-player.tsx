"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RotateCcw } from "lucide-react"

interface Choice {
  text: string
  nextScene: string
}

interface Scene {
  description: string
  choices: Choice[]
  isEnding?: boolean
}

interface GameData {
  title: string
  introduction: string
  scenes: {
    [key: string]: Scene
  }
}

interface GamePlayerProps {
  gameData: GameData
}

export default function GamePlayer({ gameData }: GamePlayerProps) {
  const [currentScene, setCurrentScene] = useState<string>("start")
  const [gameHistory, setGameHistory] = useState<string[]>([])
  const [gameStarted, setGameStarted] = useState(false)

  const handleStartGame = () => {
    setGameStarted(true)
    setCurrentScene("start")
    setGameHistory([])
  }

  const handleChoice = (nextScene: string) => {
    setGameHistory([...gameHistory, currentScene])
    setCurrentScene(nextScene)
  }

  const handleGoBack = () => {
    if (gameHistory.length > 0) {
      const previousScene = gameHistory[gameHistory.length - 1]
      setGameHistory(gameHistory.slice(0, -1))
      setCurrentScene(previousScene)
    }
  }

  const handleRestart = () => {
    setCurrentScene("start")
    setGameHistory([])
  }

  if (!gameStarted) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{gameData.title}</CardTitle>
          <CardDescription>Your custom game is ready to play!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{gameData.introduction}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleStartGame} className="w-full">
            Start Playing
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const scene = gameData.scenes[currentScene]

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{gameData.title}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleGoBack} disabled={gameHistory.length === 0}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleRestart}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose dark:prose-invert max-w-none">
          <p className="whitespace-pre-line">{scene.description}</p>
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full space-y-2">
          {scene.isEnding ? (
            <Button onClick={handleRestart} className="w-full">
              Play Again
            </Button>
          ) : (
            scene.choices.map((choice, index) => (
              <Button
                key={index}
                onClick={() => handleChoice(choice.nextScene)}
                variant="outline"
                className="w-full justify-start text-left"
              >
                {choice.text}
              </Button>
            ))
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

