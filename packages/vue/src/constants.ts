/**
 * @module
 * This module contains the constants used by the Vigilo Vue component.
 * These constants include configuration for the panel's appearance and behavior,
 * such as the maximum number of items to display, the undo window duration,
 * and the visual theme of the component.
 */

/**
 * The maximum number of items to display in the Vigilo panel.
 * This constant controls how many items are visible at once, helping to manage
 * the visual complexity of the interface.
 *
 * @type {number}
 * @default 3
 */
export const MAX_VISIBLE_ITEMS = 3

/**
 * The duration in milliseconds for the undo feature.
 * This constant defines the time window during which a user can undo an action.
 * After this period, the undo option for a given action will no longer be available.
 *
 * @type {number}
 * @default 8000
 */
export const UNDO_WINDOW_MS = 8000

/**
 * @interface Theme
 * @property {object} colors - Defines the color palette for the component.
 * @property {string} colors.primary - The primary color for accents and highlights.
 * @property {string} colors.primaryDim - A dimmed version of the primary color, often used for backgrounds or less prominent elements.
 * @property {string} colors.freeroam - The color used for the freeroam mode indicator.
 * @property {string} colors.textMain - The main text color.
 * @property {string} colors.textDim - A dimmed text color for secondary information.
 * @property {string} colors.bgPanel - The background color of the main panel.
 * @property {string} colors.borderPanel - The border color of the main panel.
 * @property {string} colors.bgOverlay - The background color for overlays, typically with transparency.
 * @property {object} layout - Defines the layout and styling of various component parts.
 * @property {string} layout.panel - The CSS classes for the main panel's layout.
 * @property {string} layout.item - The CSS classes for individual items within the panel.
 * @property {string} layout.header - The CSS classes for the panel's header.
 * @property {string} layout.badge - The CSS classes for badges.
 * @property {object} z - Defines the z-index values for different layers of the component.
 * @property {number} z.lines - The z-index for connector lines.
 * @property {number} z.overlay - The z-index for the overlay.
 * @property {number} z.panel - The z-index for the main panel.
 */
export interface Theme {
  colors: {
    primary: string
    primaryDim: string
    freeroam: string
    textMain: string
    textDim: string
    bgPanel: string
    borderPanel: string
    bgOverlay: string
  }
  layout: {
    panel: string
    item: string
    header: string
    badge: string
  }
  z: {
    lines: number
    overlay: number
    panel: number
  }
}

/**
 * The base theme for the Vigilo Vue component.
 * This object contains the default colors, layout styles, and z-index values.
 * It can be customized to create a different look and feel for the component.
 *
 * @type {Theme}
 */
export const baseTheme: Theme = {
  colors: {
    primary: 'rgb(59, 130, 246)',
    primaryDim: 'rgba(59, 130, 246, 0.1)',
    freeroam: 'rgb(139, 92, 246)',
    textMain: 'text-gray-200',
    textDim: 'text-zinc-500',
    bgPanel: 'bg-zinc-950',
    borderPanel: 'border-zinc-800',
    bgOverlay: 'rgba(0, 0, 0, 0.0)',
  },
  layout: {
    panel:
      'fixed flex flex-col gap-2 border px-4 pb-4 pt-0 w-96 shadow-2xl transition-all backdrop-blur-md z-50',
    item: 'relative flex items-center gap-3 p-1.5 px-2 transition-colors w-full',
    header: 'flex items-center justify-between gap-2 min-w-0 border-b pb-1',
    badge: 'shrink-0 px-1.5 py-0.5 text-xs font-medium',
  },
  z: {
    lines: 9990,
    overlay: 9995,
    panel: 9999,
  },
}

/**
 * @interface Styles
 * @property {string} panel - The CSS classes for the main panel.
 * @property {string} item - The CSS classes for individual items.
 * @property {string} header - The CSS classes for the panel's header.
 * @property {string} badge - The CSS classes for badges.
 * @property {object} connectorDot - The SVG attributes for the connector dot.
 * @property {string} connectorDot.fill - The fill color of the connector dot.
 * @property {num
 * ber} connectorDot.r - The radius of the connector dot.
 * @property {object} freeroamDot - The SVG attributes for the freeroam dot.
 * @property {string} freeroamDot.fill - The fill color of the freeroam dot.
 * @property {string} freeroamDot.stroke - The stroke color of the freeroam dot.
 * @property {number} freeroamDot.strokeWidth - The stroke width of the freeroam dot.
 * @property {number} freeroamDot.r - The radius of the freeroam dot.
 * @property {number} freeroamDot.opacity - The opacity of the freeroam dot.
 */
export interface Styles {
  panel: string
  item: string
  header: string
  badge: string
  connectorDot: {
    fill: string
    r: number
  }
  freeroamDot: {
    fill: string
    stroke: string
    strokeWidth: number
    r: number
    opacity: number
  }
}

/**
 * The base styles for the Vigilo Vue component.
 * This object combines the layout and color definitions from the `baseTheme`
 * to create a complete set of CSS classes for the component.
 */
export const baseStyles: Styles = {
  panel: `${baseTheme.layout.panel} ${baseTheme.colors.textMain} ${baseTheme.colors.bgPanel} ${baseTheme.colors.borderPanel}`,
  item: `${baseTheme.layout.item} hover:bg-white/5`,
  header: `${baseTheme.layout.header} ${baseTheme.colors.borderPanel}`,
  badge: `${baseTheme.layout.badge} bg-blue-900/50 text-blue-200`,
  connectorDot: {
    fill: baseTheme.colors.primary,
    r: 4,
  },
  freeroamDot: {
    fill: baseTheme.colors.freeroam,
    stroke: baseTheme.colors.freeroam,
    strokeWidth: 1.5,
    r: 3.5,
    opacity: 0.9,
  },
}

/**
 * The default theme for the Vigilo Vue component.
 * This is an alias for `baseTheme` and is provided for convenience.
 *
 * @type {Theme}
 */
export const theme: Theme = baseTheme

/**
 * The default styles for the Vigilo Vue component.
 * This is an alias for `baseStyles` and is provided for convenience.
 */
export const styles: Styles = baseStyles

