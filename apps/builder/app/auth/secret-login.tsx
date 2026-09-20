import { Button, Flex, InputField, theme } from "@webstudio-is/design-system";
import { useState } from "react";
import { authPath } from "~/shared/router-utils";
import { useLocale } from "~/i18n/context";

type SecretLoginProps = {
  devPlanNames?: string[];
};

export const SecretLogin = ({ devPlanNames }: SecretLoginProps) => {
  const { dict } = useLocale();
  const [show, setShow] = useState(true);
  if (show) {
    return (
      <form
        method="post"
        action={authPath({ provider: "dev" })}
        style={{ display: "contents" }}
      >
        <Flex gap="2" direction="column">
          <InputField
            name="email"
            type="email"
            required
            autoFocus
            placeholder={dict.auth.secretLogin.emailPlaceholder}
          />
          <InputField
            name="secret"
            type="password"
            minLength={2}
            required
            placeholder={dict.auth.secretLogin.secretPlaceholder}
          />
          {devPlanNames && devPlanNames.length > 0 && (
            <select name="devPlan">
              <option value="">
                {dict.auth.secretLogin.defaultPlanOption}
              </option>
              {devPlanNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
          <Button color="primary" type="submit">
            {dict.auth.secretLogin.submit}
          </Button>
        </Flex>
      </form>
    );
  }

  return (
    <Button onClick={() => setShow(true)} css={{ height: theme.spacing[15] }}>
      {dict.auth.secretLogin.toggleButton}
    </Button>
  );
};
