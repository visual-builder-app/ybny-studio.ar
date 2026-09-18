import { Button, Flex, InputField, theme } from "@webstudio-is/design-system";
import { useState } from "react";
import { authPath } from "~/shared/router-utils";
import { dict } from "~/i18n";

type SecretLoginProps = {
  devPlanNames?: string[];
};

export const SecretLogin = ({ devPlanNames }: SecretLoginProps) => {
  const [show, setShow] = useState(false);
  if (show) {
    return (
      <form
        method="post"
        action={authPath({ provider: "dev" })}
        style={{ display: "contents" }}
      >
        <Flex gap="2" direction="column">
          <InputField
            name="secret"
            type="text"
            minLength={2}
            required
            autoFocus
            placeholder={dict.auth.secretLogin.secretPlaceholder}
          />
          <InputField
            name="email"
            type="email"
            placeholder={dict.auth.secretLogin.emailPlaceholder}
          />
          <select name="devPlan">
            <option value="">{dict.auth.secretLogin.defaultPlanOption}</option>
            {devPlanNames?.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
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
