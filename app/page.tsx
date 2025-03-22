"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import ExamplePrompts from "@/components/example-prompts"

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [gameHtml, setGameHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generationStep, setGenerationStep] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    try {
      setIsGenerating(true)
      setError(null)
      setGameHtml(null)

      // Start the generation step animation
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

      try {
        // Call the API route directly from the client
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        })

        if (!response.ok) {
          let errorMessage = "Failed to generate game"
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            // If we can't parse the error as JSON, use the status text
            errorMessage = `Server error: ${response.statusText || response.status}`
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()
        if (!data.html) {
          throw new Error("No HTML content returned from the server")
        }

        setGameHtml(data.html)
      } catch (err: any) {
        console.error("Error from API:", err)
        setError(err.message || "Failed to generate game. Please try again.")
      }

      // Clear the interval if it's still running
      clearInterval(stepInterval)
      setGenerationStep(9) // Ensure we show the final step
    } catch (err: any) {
      console.error("Error in client code:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectPrompt = (selectedPrompt: string) => {
    setPrompt(selectedPrompt)
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-center mb-8">MyGame</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create Your Game</CardTitle>
          <CardDescription>
            Describe the game you want to play and our AI will generate it for you using a multi-agent system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Describe the game you want to play. For example: A 2D platformer game where you play as a ninja cat collecting sushi..."
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
                  ></div>
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
                  {generationStep === 10 && "Applying finishing touches..."}
                </p>
              </div>
            )}
          </form>
        </CardContent>
        {error && (
          <CardFooter className="bg-red-50 text-red-500 p-4 rounded-b-lg">
            <div className="flex flex-col space-y-1">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          </CardFooter>
        )}
      </Card>

      {gameHtml && (
        <Card>
          <CardHeader>
            <CardTitle>Your Generated Game</CardTitle>
            <CardDescription>Play the game below or copy the HTML to save it for later.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(gameHtml)
                  alert("Game HTML copied to clipboard!")
                }}
                variant="outline"
              >
                Copy Game HTML
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe
                srcDoc={gameHtml}
                className="w-full h-[600px]"
                title="Generated Game"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}

