import type { LockerLayout, SizeSpec } from '@city-groom/api-client'
import { describe, expect, it } from 'vitest'

import {
  COLUMN_WIDTH_UNITS,
  GAP_UNITS,
  computeLockerDrawing,
  exampleDoorLabel,
} from './lockerDrawing'

const sizes = [
  { code: 'S', grid_units: 1 },
  { code: 'M', grid_units: 2 },
  { code: 'L', grid_units: 5 },
  { code: 'XL', grid_units: 20 },
] as SizeSpec[]

function layout(compartments: Partial<LockerLayout['compartments'][number]>[]): LockerLayout {
  return {
    control_panel_column: 1,
    column_grid_units: 20,
    control_panel_grid_units: 6,
    compartments: compartments.map((c, i) => ({ id: i, label: `D${i}`, ...c })),
  } as LockerLayout
}

describe('computeLockerDrawing', () => {
  it('stacks doors from the top of each column', () => {
    const drawing = computeLockerDrawing(
      layout([
        { column: 0, position: 1, size: 'M' },
        { column: 0, position: 0, size: 'S' },
      ]),
      sizes,
    )

    const [first, second] = drawing.doors
    expect(first).toMatchObject({ size: 'S', y: GAP_UNITS, height: 1 })
    expect(second).toMatchObject({ size: 'M', y: GAP_UNITS + 1, height: 2 })
  })

  it('leaves room for the control panel in its column', () => {
    const drawing = computeLockerDrawing(layout([{ column: 1, position: 0, size: 'S' }]), sizes)

    expect(drawing.panel).toMatchObject({ y: GAP_UNITS, height: 6 })
    expect(drawing.doors[0]?.y).toBe(GAP_UNITS + 6)
  })

  it('sizes the drawing from the number of columns', () => {
    const drawing = computeLockerDrawing(layout([{ column: 2, position: 0, size: 'XL' }]), sizes)

    expect(drawing.width).toBeCloseTo(GAP_UNITS + 3 * (COLUMN_WIDTH_UNITS + GAP_UNITS))
    expect(drawing.height).toBe(20 + 2 * GAP_UNITS)
  })

  it('rejects unknown sizes', () => {
    expect(() => computeLockerDrawing(layout([{ column: 0, position: 0, size: 'S' }]), [])).toThrow(
      'Unknown compartment size',
    )
  })
})

describe('exampleDoorLabel', () => {
  it('returns the first door of the requested size, or null', () => {
    const drawing = computeLockerDrawing(
      layout([
        { column: 0, position: 0, size: 'S', label: 'A1' },
        { column: 0, position: 1, size: 'M', label: 'A2' },
      ]),
      sizes,
    )

    expect(exampleDoorLabel(drawing, 'M')).toBe('A2')
    expect(exampleDoorLabel(drawing, 'XL')).toBeNull()
  })
})
