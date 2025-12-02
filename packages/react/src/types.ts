import type { CategoryConfig, VigiloConfig, VigiloStorage } from '@remcostoeten/vigilo-core'
import type { baseTheme, baseStyles } from './constants'

export type { CategoryConfig, VigiloConfig }

/**
 * Props for the Vigilo React component. Passing a literal `categories` array
 * narrows the `category` prop to the provided IDs for better intellisense.
 *
 * Theme props accept Tailwind utility strings, CSS variables, rgb(a), or hex values.
 * Provide `themeOverrides.modes.light|dark` to customize per color mode.
 */
export interface VigiloProps<
  TCategories extends readonly CategoryConfig[] = CategoryConfig[]
> extends VigiloConfig<TCategories[number]['id']> {
  categories: TCategories
  enabled?: boolean
  storage?: VigiloStorage
  /** Override any theme token while keeping defaults for unspecified keys */
  themeOverrides?: Partial<typeof baseTheme> & {
    modes?: {
      light?: Partial<typeof baseTheme>
      dark?: Partial<typeof baseTheme>
    }
  }
  /** Override layout classes/connector dots without rebuilding the component */
  stylesOverrides?: Partial<typeof baseStyles>
  /** Choose which override set (light/dark) to merge */
  colorMode?: 'light' | 'dark'
}
