import { TooltipProvider } from "@radix-ui/react-tooltip";
import {
  Button,
  Flex,
  Text,
  theme,
  cssVar,
  webstudioBrand,
} from "@webstudio-is/design-system";
import { GithubIcon, GoogleIcon, WebstudioIcon } from "@webstudio-is/icons";
import { Form } from "@remix-run/react";
import { authPath } from "~/shared/router-utils";
import { useLocale } from "~/i18n/context";
import { LanguageSwitcher } from "~/i18n/language-switcher";
import { SecretLogin } from "./secret-login";

export type LoginProps = {
  errorMessage?: string;
  isGithubEnabled?: boolean;
  isGoogleEnabled?: boolean;
  isSecretLoginEnabled?: boolean;
  devPlanNames?: string[];
};

export const Login = ({
  errorMessage,
  isGithubEnabled,
  isGoogleEnabled,
  isSecretLoginEnabled,
  devPlanNames,
}: LoginProps) => {
  const { dict } = useLocale();
  return (
    <Flex
      align="center"
      justify="center"
      css={{
        height: "100vh",
        position: "relative",
        color: cssVar("--foreground-primary"),
        background: webstudioBrand.backgroundGradient,
      }}
    >
      <Flex
        css={{
          position: "absolute",
          insetBlockStart: theme.spacing[4],
          insetInlineEnd: theme.spacing[4],
        }}
      >
        <LanguageSwitcher />
      </Flex>
      <Flex
        direction="column"
        align="center"
        gap="6"
        css={{
          width: theme.spacing[35],
          minWidth: theme.spacing[20],
          padding: theme.spacing[17],
          borderRadius: theme.spacing[5],
          backgroundColor: `oklch(from ${cssVar("--background-primary")} l c h / 50%)`,
        }}
      >
        <WebstudioIcon size={48} />
        <Text variant="brandSectionTitle" as="h1" align="center">
          {dict.auth.login.welcome}
        </Text>

        <TooltipProvider>
          <Flex direction="column" gap="3" css={{ width: "100%" }}>
            {(isGoogleEnabled || isGithubEnabled) && (
              <Form method="post" style={{ display: "contents" }}>
                {isGoogleEnabled && (
                  <Button
                    prefix={<GoogleIcon size={22} />}
                    color="primary"
                    css={{ height: theme.spacing[15] }}
                    formAction={authPath({ provider: "google" })}
                  >
                    {dict.auth.login.continueWithGoogle}
                  </Button>
                )}
                {isGithubEnabled && (
                  <Button
                    prefix={<GithubIcon size={22} fill="currentColor" />}
                    color="ghost"
                    css={{
                      border: `1px solid ${cssVar("--border-default")}`,
                      height: theme.spacing[15],
                    }}
                    formAction={authPath({ provider: "github" })}
                  >
                    {dict.auth.login.continueWithGithub}
                  </Button>
                )}
              </Form>
            )}
            {isSecretLoginEnabled && (
              <SecretLogin devPlanNames={devPlanNames} />
            )}
          </Flex>
        </TooltipProvider>
        {errorMessage ? (
          <Text align="center" color="destructive">
            {errorMessage}
          </Text>
        ) : null}
      </Flex>
    </Flex>
  );
};
