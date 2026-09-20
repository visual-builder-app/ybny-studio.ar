/**
 * Language switcher for the builder chrome. Renders the *other* locale by its
 * own native name ("English" while the interface is Arabic) and persists the
 * choice through the locale cookie, so the next server render already carries
 * the right `<html lang dir>`.
 */
import { Button, theme } from "@webstudio-is/design-system";
import { useLocale } from "./context";
import { localeLabels, supportedLocales } from "./locale";

export const LanguageSwitcher = () => {
  const { locale, dict, setLocale } = useLocale();
  const nextLocale =
    supportedLocales.find((candidate) => candidate !== locale) ?? locale;

  return (
    <Button
      color="ghost"
      aria-label={dict.locale.switchLabel}
      css={{ height: theme.spacing[12], paddingInline: theme.spacing[3] }}
      onClick={() => setLocale(nextLocale)}
    >
      {localeLabels[nextLocale]}
    </Button>
  );
};
