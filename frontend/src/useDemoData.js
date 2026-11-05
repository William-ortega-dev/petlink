import { useContext } from 'react'
import { DemoContext } from './demoContext'

export function useDemoData() {
  const context = useContext(DemoContext)
  if (!context) throw new Error('useDemoData debe utilizarse dentro de DemoProvider.')
  return context
}
