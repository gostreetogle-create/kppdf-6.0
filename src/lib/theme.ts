/**
 * Mantine theme для всего приложения (gradient + russian locale).
 */
import { createTheme, rem } from '@mantine/core';

export const mantineTheme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  headings: {
    fontWeight: '600',
    sizes: {
      h1: { fontSize: rem(28) },
      h2: { fontSize: rem(22) },
      h3: { fontSize: rem(18) },
    },
  },
  components: {
    Button: {
      defaultProps: { size: 'sm' },
    },
    TextInput: {
      defaultProps: { size: 'sm' },
    },
    Select: {
      defaultProps: { size: 'sm' },
    },
    Table: {
      defaultProps: { verticalSpacing: 'sm', horizontalSpacing: 'md' },
    },
  },
  other: {
    locale: 'ru',
  },
});
