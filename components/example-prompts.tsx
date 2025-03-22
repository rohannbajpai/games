"use client"

import { Button } from "@/components/ui/button"

interface ExamplePromptsProps {
  onSelectPrompt: (prompt: string) => void
}

export default function ExamplePrompts({ onSelectPrompt }: ExamplePromptsProps) {
  const examplePrompts = [
    "A 2D platformer game where you play as a ninja cat collecting sushi",
    "A simple space shooter game where you defend Earth from alien invaders",
    "A puzzle game where you connect pipes to direct water flow",
    "A racing game where you drive a car through a track with obstacles",
  ]

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Need inspiration? Try one of these examples:</p>
      <div className="flex flex-wrap gap-2">
        {examplePrompts.map((prompt, index) => (
          <Button key={index} variant="outline" size="sm" onClick={() => onSelectPrompt(prompt)} className="text-xs">
            {prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt}
          </Button>
        ))}
      </div>
    </div>
  )
}

