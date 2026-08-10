'use client'

import { ArrowRight, ScanFace, Sparkles, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FaceAnalysisStep } from '@/config/face-analysis'
import { cn } from '@/utils/cn'

interface FaceAnalysisStepperProps {
  currentStep: FaceAnalysisStep | 'analyzing'
}

const stepIds: Array<FaceAnalysisStep | 'analyzing'> = ['photo', 'analysis', 'report']
const stepIcons = { photo: User, analysis: ScanFace, report: Sparkles } as const

function stepIndex(step: FaceAnalysisStepperProps['currentStep']) {
  if (step === 'analyzing') return 1
  return stepIds.findIndex((s) => s === step)
}

export function FaceAnalysisStepper({ currentStep }: FaceAnalysisStepperProps) {
  const t = useTranslations('faceAnalysis.stepper')
  const activeIndex = stepIndex(currentStep)

  return (
    <div className="mb-5 flex items-center justify-center sm:mb-8">
      <div className="flex items-center space-x-2 sm:space-x-4">
        {stepIds.map((stepId, index) => {
          const Icon = stepIcons[stepId as keyof typeof stepIcons]
          const isComplete = index < activeIndex
          const isActive = index === activeIndex
          const label =
            stepId === 'photo' ? t('photo') : stepId === 'analysis' ? t('analysis') : t('report')

          return (
            <div key={stepId} className="flex items-center">
              <div
                className={cn(
                  'flex items-center',
                  isComplete ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-400'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    isComplete ? 'bg-green-100' : isActive ? 'bg-blue-100' : 'bg-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="ml-2 hidden font-medium sm:inline">{label}</span>
              </div>
              {index < stepIds.length - 1 && (
                <ArrowRight className="mx-3 h-4 w-4 text-gray-400 sm:mx-4" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
