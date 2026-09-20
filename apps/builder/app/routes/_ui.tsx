import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  type ClientLoaderFunctionArgs,
  type ShouldRevalidateFunction,
} from "@remix-run/react";
import designSystemGlobalCss from "@webstudio-is/design-system/global.css?url";
import {
  json,
  type LinksFunction,
  type LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import { ErrorBoundary as ErrorBoundaryComponent } from "~/shared/error/error-boundary";
import { getCsrfTokenAndCookie } from "~/services/csrf-session.server";
import invariant from "tiny-invariant";
import {
  csrfToken as clientCsrfToken,
  updateCsrfToken,
} from "~/shared/csrf.client";
import {
  createPrivateNoStoreHeaders,
  privateNoStoreResponseHeaders,
} from "~/services/cache-control.server";
import { ColorSchemeController } from "~/shared/color-scheme-controller";
import {
  createColorSchemeBootstrapScript,
  parseColorSchemeCookie,
  type ColorSchemePreference,
} from "~/shared/color-scheme";
import { LocaleProvider } from "~/i18n/context";
import {
  defaultLocale,
  dirFor,
  parseLocaleCookie,
  type Locale,
} from "~/i18n/locale";

export const links: LinksFunction = () => {
  // `links` returns an array of objects whose
  // properties map to the `<link />` component props
  return [{ rel: "stylesheet", href: designSystemGlobalCss }];
};

const Document = (props: {
  children: React.ReactNode;
  colorScheme?: ColorSchemePreference;
  locale?: Locale;
}) => {
  const locale = props.locale ?? defaultLocale;
  return (
    <html lang={locale} dir={dirFor(locale)} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: createColorSchemeBootstrapScript(props.colorScheme),
          }}
        />
        <Meta />
        <Links />
      </head>
      <body>
        <ColorSchemeController />
        {props.children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [csrfToken, setCookieValue] = await getCsrfTokenAndCookie(request);
  // The interface locale is cookie-driven: Arabic unless the visitor chose
  // English through the switcher. Read server-side so the very first response
  // already carries the right <html lang dir> with no flash.
  const locale =
    parseLocaleCookie(request.headers.get("Cookie")) ?? defaultLocale;

  if (request.headers.get("sec-fetch-mode") !== "navigate") {
    return json(
      {
        csrfToken: "",
        colorScheme: parseColorSchemeCookie(request.headers.get("Cookie")),
        locale,
      },
      { headers: privateNoStoreResponseHeaders }
    );
  }

  const headers = createPrivateNoStoreHeaders();

  if (setCookieValue !== undefined) {
    headers.set("Set-Cookie", setCookieValue);
  }

  return json(
    {
      csrfToken,
      colorScheme: parseColorSchemeCookie(request.headers.get("Cookie")),
      locale,
    },
    {
      headers,
    }
  );
};

export const clientLoader = async ({
  serverLoader,
}: ClientLoaderFunctionArgs) => {
  const serverData = await serverLoader<typeof loader>();

  if (clientCsrfToken === undefined) {
    const { csrfToken } = serverData;
    invariant(csrfToken !== "", "CSRF token is empty");
    updateCsrfToken(csrfToken);
  }

  // Hide real CSRF token from window.__remixContext
  serverData.csrfToken = "";
  return serverData;
};

clientLoader.hydrate = true;

export const ErrorBoundary = () => {
  return (
    <Document>
      <LocaleProvider>
        <ErrorBoundaryComponent />
      </LocaleProvider>
    </Document>
  );
};

export default function Layout() {
  const { colorScheme, locale } = useLoaderData<typeof loader>();
  return (
    <Document colorScheme={colorScheme} locale={locale}>
      <LocaleProvider initialLocale={locale}>
        <Outlet />
      </LocaleProvider>
    </Document>
  );
}

export const shouldRevalidate: ShouldRevalidateFunction = () => {
  return false;
};
