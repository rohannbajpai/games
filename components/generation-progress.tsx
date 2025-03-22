"use client"

import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"

interface GenerationProgressProps {
  isGenerating: boolean
}

export default function GenerationProgress({ isGenerating }: GenerationProgressProps) {
  const [progress, setProgress] = useState(0)
  const steps = [
    "Perception: Processing your request...",
    "Attention: Identifying key elements...",
    "Memory: Retrieving relevant knowledge...",
    "Emotion: Evaluating player experience...",
    "Context: Synthesizing game narrative...",
    "Planning: Generating game mechanics...",
    "World Model: Ensuring feasibility...",
    "Decision: Selecting optimal design...",
    "Action: Creating your game...",
  ]

  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (!isGenerating) {
      setProgress(0)
      setCurrentStep(0)
      return
    }

    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 99) {
          clearInterval(interval)
          return 99
        }

        // Update the current step based on progress
        const newStep = Math.floor((prevProgress / 100) * steps.length)
        if (newStep !== currentStep && newStep < steps.length) {
          setCurrentStep(newStep)
        }

        return prevProgress + 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isGenerating, currentStep, steps.length])

  if (!isGenerating) return null

  return (
    <div className="w-full space-y-2 mt-4">
      <div className="flex justify-between text-sm">
        <span>Generating your game...</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="w-full" />
      <p className="text-sm text-muted-foreground">{steps[currentStep]}</p>
    </div>
  )
}

