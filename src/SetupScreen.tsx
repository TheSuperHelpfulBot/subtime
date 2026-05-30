import type { ReactNode } from 'react'

export type SetupScreenHeaderProps = {
  children: ReactNode
  className?: string
}

export type SetupScreenBodyProps = {
  children: ReactNode
  className?: string
}

export type SetupScreenPanelProps = {
  children: ReactNode
  className?: string
  testId?: string
}

export function SetupScreenHeader({ children, className }: SetupScreenHeaderProps) {
  return (
    <header className={['setup-screen-header', className].filter(Boolean).join(' ')}>
      {children}
    </header>
  )
}

export function SetupScreenBody({ children, className }: SetupScreenBodyProps) {
  return (
    <div className={['setup-screen-body', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

export default function SetupScreenPanel({ children, className, testId }: SetupScreenPanelProps) {
  return (
    <div
      className={['setup-screen-panel', className].filter(Boolean).join(' ')}
      data-testid={testId}
    >
      {children}
    </div>
  )
}
