// Public, read-only seminar table provided by the owner. No API key or login.
export const eventsSource = {
  spreadsheetId: '1bueVi5KHdSxjmI6aEn--IbtZJw8EeYBjMakyUvgeg0U',
  sheetId: '0',
  sheetName: 'Tabellenblatt1',
};
export const eventsCsvUrl = `https://docs.google.com/spreadsheets/d/${eventsSource.spreadsheetId}/export?format=csv&gid=${eventsSource.sheetId}`;
