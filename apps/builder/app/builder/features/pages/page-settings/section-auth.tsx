import { useId, useState } from "react";
import {
  Checkbox,
  CheckboxAndLabel,
  cssVar,
  Grid,
  InputErrorsTooltip,
  InputField,
  Label,
  ProChip,
  Text,
  Tooltip,
} from "@webstudio-is/design-system";
import { InfoCircleIcon } from "@webstudio-is/icons";
import type {
  PageSettingsErrors,
  PageSettingsValues,
} from "@webstudio-is/project-build/runtime";
import type { OnChange } from "./shared";

const emptyAuth: PageSettingsValues["auth"] = {
  login: "",
  password: "",
};

export const AuthSection = ({
  values,
  errors,
  onChange,
  showUpgrade = false,
  showErrors = false,
}: {
  values: PageSettingsValues;
  errors: PageSettingsErrors;
  onChange: OnChange;
  showUpgrade?: boolean;
  showErrors?: boolean;
}) => {
  const enableId = useId();
  const loginId = useId();
  const passwordId = useId();
  const [isExpanded, setIsExpanded] = useState(
    values.auth.login !== "" || values.auth.password !== ""
  );
  const [touchedFields, setTouchedFields] = useState({
    login: false,
    password: false,
  });
  return (
    <Grid gap={2}>
      <Grid gap={1}>
        <CheckboxAndLabel>
          <Checkbox
            id={enableId}
            checked={isExpanded}
            onCheckedChange={(checked) => {
              const nextIsExpanded = checked === true;
              setIsExpanded(nextIsExpanded);
              if (nextIsExpanded === false) {
                setTouchedFields({ login: false, password: false });
                onChange({
                  field: "auth",
                  value: emptyAuth,
                });
              }
            }}
          />
          <Label htmlFor={enableId}>طلب اسم مستخدم وكلمة مرور</Label>
          {showUpgrade && <ProChip>PRO</ProChip>}
          <Tooltip
            content={
              <>
                <Text>
                  يطلب التحقق من الزوار بيانات HTTP Basic Auth قبل تحميل الصفحات
                  المحمية على النطاقات المخصصة.
                </Text>
                {showUpgrade && (
                  <>
                    <br />
                    <Text>
                      التحقق من الوصول للصفحات ميزة احترافية. يمكنك النشر على
                      بيئة التجربة مجانًا؛ قم بالترقية إلى Pro للنشر على النطاقات
                      المخصصة.
                    </Text>
                  </>
                )}
              </>
            }
            variant="wrapped"
          >
            <InfoCircleIcon
              color={cssVar("--foreground-secondary")}
              tabIndex={-1}
            />
          </Tooltip>
        </CheckboxAndLabel>
        <Grid gap={1}>
          <Text color="subtle">
            {isExpanded ? (
              <>
                سيُطلب من الزوار على <b>النطاقات المخصصة</b> إدخال بيانات HTTP
                Basic Auth قبل تحميل هذه الصفحة.
              </>
            ) : (
              "يمكن لأي شخص الوصول إلى هذه الصفحة حاليًا."
            )}
          </Text>
        </Grid>
      </Grid>

      {isExpanded && (
        <Grid
          gapX={2}
          gapY={2}
          align="center"
          css={{
            gridTemplateColumns: `auto 1fr`,
          }}
        >
          <Label htmlFor={loginId}>اسم المستخدم</Label>
          <InputErrorsTooltip
            errors={
              showErrors || touchedFields.login ? errors.auth?.login : undefined
            }
          >
            <InputField
              color={
                (showErrors || touchedFields.login) && errors.auth?.login
                  ? "error"
                  : undefined
              }
              id={loginId}
              value={values.auth.login}
              onChange={(event) => {
                setTouchedFields((touchedFields) => ({
                  ...touchedFields,
                  login: true,
                }));
                onChange({
                  field: "auth",
                  value: { ...values.auth, login: event.target.value },
                });
              }}
            />
          </InputErrorsTooltip>
          <Label htmlFor={passwordId}>كلمة المرور</Label>
          <InputErrorsTooltip
            errors={
              showErrors || touchedFields.password
                ? errors.auth?.password
                : undefined
            }
          >
            <InputField
              color={
                (showErrors || touchedFields.password) && errors.auth?.password
                  ? "error"
                  : undefined
              }
              id={passwordId}
              type="password"
              value={values.auth.password}
              onChange={(event) => {
                setTouchedFields((touchedFields) => ({
                  ...touchedFields,
                  password: true,
                }));
                onChange({
                  field: "auth",
                  value: { ...values.auth, password: event.target.value },
                });
              }}
            />
          </InputErrorsTooltip>
        </Grid>
      )}
    </Grid>
  );
};
