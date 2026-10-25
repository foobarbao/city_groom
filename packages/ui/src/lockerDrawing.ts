/**
 * @file Geometry of a locker front drawing, computed from the API layout.
 *
 * Kept free of Vue and DOM code so it can be unit-tested. Coordinates are in
 * "grid units": a column is `columnGridUnits` high and `COLUMN_WIDTH_UNITS`
 * wide; doors are stacked from the top in the order given by `position`.
 */
import type {
  CompartmentSize,
  LockerLayout,
  SizeSpec,
} from "@city-groom/api-client";

/** Width of a column, in grid units (a door is about as wide as 4.75 S heights). */
export const COLUMN_WIDTH_UNITS = 4.75;
/** Space between columns and around the locker, in grid units. */
export const GAP_UNITS = 0.25;

/** A door rectangle ready to draw. */
export interface DoorRect {
  id: number;
  label: string;
  size: CompartmentSize;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The control panel rectangle (screen and readers). */
export interface PanelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Everything needed to draw a locker front. */
export interface LockerDrawing {
  width: number;
  height: number;
  doors: DoorRect[];
  panel: PanelRect;
}

/**
 * Computes the rectangles of every door and of the control panel.
 *
 * @param layout - Locker front from `GET /api/lockers/{code}/`.
 * @param sizes - Size catalogue, giving the height of each size in grid units.
 * @returns The drawing geometry, in grid units.
 * @throws {Error} If a compartment uses a size missing from the catalogue.
 */
export function computeLockerDrawing(
  layout: LockerLayout,
  sizes: SizeSpec[],
): LockerDrawing {
  const unitsBySize = new Map(
    sizes.map((spec) => [spec.code, spec.grid_units]),
  );
  const columnCount = Math.max(
    layout.control_panel_column + 1,
    ...layout.compartments.map((c) => c.column + 1),
  );
  const columnX = (column: number): number =>
    GAP_UNITS + column * (COLUMN_WIDTH_UNITS + GAP_UNITS);

  const sorted = [...layout.compartments].sort(
    (a, b) => a.column - b.column || a.position - b.position,
  );
  const nextY = new Map<number, number>();
  const doors: DoorRect[] = sorted.map((compartment) => {
    const units = unitsBySize.get(compartment.size);
    if (units === undefined) {
      throw new Error(`Unknown compartment size ${compartment.size}`);
    }
    const panelOffset =
      compartment.column === layout.control_panel_column
        ? layout.control_panel_grid_units
        : 0;
    const y = nextY.get(compartment.column) ?? GAP_UNITS + panelOffset;
    nextY.set(compartment.column, y + units);
    return {
      id: compartment.id,
      label: compartment.label,
      size: compartment.size,
      x: columnX(compartment.column),
      y,
      width: COLUMN_WIDTH_UNITS,
      height: units,
    };
  });

  return {
    width: GAP_UNITS + columnCount * (COLUMN_WIDTH_UNITS + GAP_UNITS),
    height: layout.column_grid_units + 2 * GAP_UNITS,
    doors,
    panel: {
      x: columnX(layout.control_panel_column),
      y: GAP_UNITS,
      width: COLUMN_WIDTH_UNITS,
      height: layout.control_panel_grid_units,
    },
  };
}

/**
 * Picks the door to show as an example for a size: the first one, top-left.
 *
 * The public API does not reveal which doors are free (docs/LOCKERS.md §5),
 * so this is only a preview of what a door of that size looks like.
 * PROD: highlight the door actually assigned to the customer's order.
 *
 * @returns The label of the example door, or `null` if the locker has none of that size.
 */
export function exampleDoorLabel(
  drawing: LockerDrawing,
  size: CompartmentSize,
): string | null {
  return drawing.doors.find((door) => door.size === size)?.label ?? null;
}
