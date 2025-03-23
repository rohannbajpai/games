"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Save, Loader2, Maximize, Minimize, MessageCircle, Send, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import ExamplePrompts from "@/components/example-prompts"

import FlappyBird from "@/components/flappy-bird"

export default function Home() {
  // ------------------------------
  // High-level states
  // ------------------------------
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [gameHtml, setGameHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generationStep, setGenerationStep] = useState(0)

  // Generated game name + expand/fullscreen toggles
  const [gameName, setGameName] = useState("MyGame")
  const [isGameExpanded, setIsGameExpanded] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // 2) Controls whether we show the FlappyBird mini‑game
  const [showLoadingGame, setShowLoadingGame] = useState(false)

  // Refs for the final game iframe
  const gameIframeRef = useRef<HTMLIFrameElement>(null)
  const gameContainerRef = useRef<HTMLDivElement>(null)

  // ------------------------------
  // Chat / modal states
  // ------------------------------
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([
    {role: "system", content: "Welcome! How would you like to modify your game?"}
  ])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isUpdatingGame, setIsUpdatingGame] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ------------------------------
  // Game history states
  // ------------------------------
  const [gameHistory, setGameHistory] = useState<{id: string, name: string, html: string, date: string}[]>([
    { id: "1", name: "Space Invaders", html: "<html>...</html>", date: "2023-05-15" },
    { id: "2", name: "Platformer Adventure", html: "<html>...</html>", date: "2023-05-20" },
    { id: "3", name: "Puzzle Quest", html: "<html>...</html>", date: "2023-05-25" },
    { id: "4", name: "Racing Simulator", html: "<html>...</html>", date: "2023-06-01" },
    { id: "5", name: "RPG Journey", html: "<html>...</html>", date: "2023-06-10" }
  ])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedHistoryGame, setSelectedHistoryGame] = useState<string | null>(null)

  // Scroll the chat to the bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  // ------------------------------
  // Functions
  // ------------------------------

  // Submit prompt to generate final game
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    try {
      setIsGenerating(true)
      setError(null)
      setGameHtml(null)

      // Show the Flappy Bird mini‑game while generating
      setShowLoadingGame(true)

      // Simulate multi-step generation progress
      setGenerationStep(1)
      const stepInterval = setInterval(() => {
        setGenerationStep((prev) => {
          if (prev >= 9) {
            clearInterval(stepInterval)
            return 9
          }
          return prev + 1
        })
      }, 3000)

      // -------------------------------------
      // Example: call your /api/generate route
      // -------------------------------------
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        })

        if (!response.ok) {
          let errorMessage = "Failed to generate game"
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            errorMessage = `Server error: ${response.statusText || response.status}`
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()
        if (!data.html) {
          throw new Error("No HTML content returned from the server")
        }

        // If everything is good, set the game HTML
        nameGame(prompt)
        setGameHtml(data.html)
        setIsGameExpanded(true)

        // Add the new game to history
        const newGameId = (gameHistory.length + 1).toString()
        const currentDate = new Date().toISOString().split('T')[0]
        setGameHistory(prev => [
          { id: newGameId, name: gameName, html: data.html, date: currentDate },
          ...prev
        ])

      } catch (err: any) {
        console.error("Error from API:", err)
        setError(err.message || "Failed to generate game. Please try again.")
      }

      // Done generating: hide Flappy Bird, finalize steps
      clearInterval(stepInterval)
      setGenerationStep(9)
      setShowLoadingGame(false)
      setIsGenerating(false)
    } catch (err: any) {
      console.error("Error in client code:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsGenerating(false)
      setShowLoadingGame(false)
    }
  }

  // Give the game a name based on the prompt
  const nameGame = async (description: string) => {
    try {
      const response = await fetch("/api/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: description }),
      })
      const data = await response.json()
      setGameName(data.name)
    } catch (err) {
      // fallback
      setGameName("MyGame")
    }
  }

  // Called when user clicks an example prompt
  const handleSelectPrompt = (selectedPrompt: string) => {
    setPrompt(selectedPrompt)
  }

  // Toggle fullscreen for the generated game
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
  }

  // Copy the generated game's HTML to clipboard
  const saveGame = () => {
    if (gameHtml) {
      navigator.clipboard.writeText(gameHtml)
      alert("Game HTML copied to clipboard!")
    }
  }

  // Chat logic: send user message, get system reply (stubbed)
  const sendChatMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage = { role: "user", content: currentMessage }
    setChatMessages((prev) => [...prev, userMessage])
    setCurrentMessage("")

    setIsUpdatingGame(true)

    // Simulate a short delay
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "I've updated your game with those changes! The modifications have been applied."
        }
      ])
      setIsUpdatingGame(false)
    }, 2000)
  }

  // Load a game from history
  const loadHistoryGame = (id: string) => {
    const game = gameHistory.find(g => g.id === id)
    if (game) {
      setGameHtml(game.html)
      setGameName(game.name)
      setIsGameExpanded(true)
      setSelectedHistoryGame(id)
    }
  }

  // Filter games based on search term
  const filteredGames = gameHistory.filter(game => 
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold text-center mb-8">MyGame</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {/* 4) The separate FlappyBird mini‑game, shown while generating */}
          {showLoadingGame && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Play Flappy Bird while you wait!</CardTitle>
                <CardDescription>
                  Press Space or Up arrow to flap. Avoid the pipes!
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* This is the component you created in FlappyBird.tsx */}
                <FlappyBird />
              </CardContent>
            </Card>
          )}

          {/* 5) The final generated game */}
          {gameHtml && (
            <div className={`transition-all duration-500 ease-in-out ${isFullScreen ? "fixed inset-0 z-50 bg-background p-4" : ""}`}>
              <Card className={`${isFullScreen ? "h-full flex flex-col" : ""}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>{gameName}</CardTitle>
                    <CardDescription>Play the game below or save it for later.</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    {/* Expand/collapse the iframe */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsGameExpanded(!isGameExpanded)}
                      aria-label={isGameExpanded ? "Collapse game" : "Expand game"}
                    >
                      {isGameExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                    {/* Fullscreen toggle */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleFullScreen}
                      aria-label={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                      {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </Button>
                    {/* Copy game HTML */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={saveGame}
                      aria-label="Save game"
                    >
                      <Save size={16} />
                    </Button>
                    {/* Open chat to modify the game */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsChatOpen(true)}
                      aria-label="Chat to modify game"
                    >
                      <MessageCircle size={16} />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent 
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${isFullScreen ? "flex-grow" : ""} ${
                    isGameExpanded ? "max-h-[800px]" : "max-h-0 py-0"
                  }`}
                >
                  <div 
                    ref={gameContainerRef}
                    className={`border rounded-lg overflow-hidden bg-white ${isFullScreen ? "h-full" : ""}`}
                  >
                    <iframe
                      ref={gameIframeRef}
                      srcDoc={gameHtml}
                      className={`w-full transition-all duration-500 ${isFullScreen ? "h-full" : "h-[600px]"}`}
                      title="Generated Game"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 1) Prompt input & generation */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create Your Game</CardTitle>
              <CardDescription>
                Describe the game you want to play to start generating.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Describe the game you want..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                    className="w-full min-h-[150px]"
                  />
                  <ExamplePrompts onSelectPrompt={handleSelectPrompt} />
                </div>

                <Button type="submit" disabled={isGenerating || !prompt.trim()} className="w-full">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating your game...
                    </>
                  ) : (
                    "Generate Game"
                  )}
                </Button>

                {/* 2) Generation progress bar */}
                {isGenerating && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Generating your game...</span>
                      <span>{Math.round((generationStep / 9) * 99)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(generationStep / 9) * 99}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {generationStep === 1 && "Processing your request..."}
                      {generationStep === 2 && "Identifying key elements..."}
                      {generationStep === 3 && "Retrieving relevant knowledge..."}
                      {generationStep === 4 && "Evaluating player experience..."}
                      {generationStep === 5 && "Synthesizing game narrative..."}
                      {generationStep === 6 && "Generating game mechanics..."}
                      {generationStep === 7 && "Ensuring feasibility..."}
                      {generationStep === 8 && "Selecting optimal design..."}
                      {generationStep === 9 && "Creating your game..."}
                    </p>
                  </div>
                )}
              </form>
            </CardContent>

            {/* 3) Error display */}
            {error && (
              <CardFooter className="bg-red-50 text-red-500 p-4 rounded-b-lg">
                <div className="flex flex-col space-y-1">
                  <p className="font-semibold">Error:</p>
                  <p>{error}</p>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Game History Section */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Game Library</CardTitle>
              <CardDescription>
                Browse and replay your previously created games
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search games..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {filteredGames.length > 0 ? (
                  filteredGames.map((game) => (
                    <div 
                      key={game.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-100 ${
                        selectedHistoryGame === game.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => loadHistoryGame(game.id)}
                    >
                      <div className="font-medium">{game.name}</div>
                      <div className="text-sm text-gray-500">Created: {game.date}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No games found matching your search
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 6) Chat modal for modifying the generated game */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modify Your Game</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-[400px]">
            {/* Chat message list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 border rounded-lg mb-4">
              {chatMessages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div className="flex space-x-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Describe changes to your game..."
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                disabled={isUpdatingGame}
                className="flex-1"
              />
              <Button 
                onClick={sendChatMessage} 
                disabled={!currentMessage.trim() || isUpdatingGame}
                size="icon"
              >
                {isUpdatingGame ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 7) Floating chat button if game is generated but chat is closed */}
      {gameHtml && !isChatOpen && !isFullScreen && (
        <Button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg"
          size="icon"
        >
          <MessageCircle size={24} />
        </Button>
      )}
    </main>
  )
}
