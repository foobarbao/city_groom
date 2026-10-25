# @city-groom/ui

Visual identity and shared components of the customer app and the partner
portal (docs/DESIGN.md):

- `src/theme.css`: design tokens (light and dark) and Ionic colour mapping,
  rounded Nunito font;
- `LockerFront`: drawing of a locker front, with the door to use highlighted
  and swinging open, or every door coloured by status (operator view);
- `computeLockerDrawing`: geometry of that drawing from the API layout.

Components take their texts as props, so each app keeps its own i18n.
