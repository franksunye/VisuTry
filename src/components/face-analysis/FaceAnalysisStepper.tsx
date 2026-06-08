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
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
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
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    isComplete ? 'bg-green-100' : isActive ? 'bg-blue-100' : 'bg-gray-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="ml-2 font-medium hidden sm:inline">{label}</span>
              </div>
              {index < stepIds.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-400 mx-4" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
