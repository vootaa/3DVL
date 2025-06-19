export interface BadgeVariant {
  name: string
  class: string
  description?: string
}

export interface BadgeTheme {
  light: BadgeVariant
  dark: BadgeVariant
  sepia?: BadgeVariant
}

export interface CodeButtonProps {
  title: string
  to: string
  variant?: 'default' | 'minimal' | 'floating'
}

export interface NebulaConfig {
  variants: BadgeVariant[]
  defaultVariant: string
  themes: Record<string, BadgeTheme>
}

export const NEBULA_VARIANTS: BadgeVariant[] = [
  { name: 'primary', class: 'bg-blue-500 text-white', description: 'Primary action' },
  { name: 'secondary', class: 'bg-gray-500 text-white', description: 'Secondary action' },
  { name: 'success', class: 'bg-green-500 text-white', description: 'Success state' },
  { name: 'warning', class: 'bg-yellow-500 text-black', description: 'Warning state' },
  { name: 'danger', class: 'bg-red-500 text-white', description: 'Danger state' }
]

export const CODE_BUTTON_THEMES: Record<string, BadgeTheme> = {
  github: {
    light: { name: 'light', class: 'bg-white border-white text-gray-600' },
    dark: { name: 'dark', class: 'bg-gray-800 border-gray-800 text-gray-300' },
    sepia: { name: 'sepia', class: 'bg-amber-50 border-amber-50 text-amber-800' }
  }
}
