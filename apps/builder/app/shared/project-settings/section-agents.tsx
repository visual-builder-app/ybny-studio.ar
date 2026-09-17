import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { Flex, Grid, Text, Tooltip, cssVar } from "@webstudio-is/design-system";
import { InfoCircleIcon } from "@webstudio-is/icons";
import { CodeEditor } from "~/shared/code-editor";
import { $projectSettings } from "~/shared/sync/data-stores";
import { executeRuntimeMutation } from "~/shared/instance-utils/data";
import { sectionSpacing } from "./utils";

export const SectionAgents = () => {
  const projectSettings = useStore($projectSettings);
  const instructions = projectSettings?.meta.agentInstructions ?? "";
  const [value, setValue] = useState(instructions);

  useEffect(() => setValue(instructions), [instructions]);

  return (
    <Grid
      gap={2}
      css={{ height: "100%", gridTemplateRows: "auto minmax(0, 1fr)" }}
    >
      <Flex align="center" gap={1} css={sectionSpacing}>
        <Text variant="titles">الوكلاء</Text>
        <Tooltip
          variant="wrapped"
          content="قدّم لوكلاء البرمجة بالذكاء الاصطناعي إرشادات خاصة بالمشروع. عند مزامنة المشروع محليًا، تكتب Webstudio هذه التعليمات في ملف AGENTS.md مُدار في جذر المشروع. لا يتم أبدًا استبدال ملف AGENTS.md موجود يملكه المستخدم."
        >
          <InfoCircleIcon
            color={cssVar("--foreground-secondary")}
            tabIndex={0}
          />
        </Tooltip>
      </Flex>
      <Grid gap={1} css={{ ...sectionSpacing, minHeight: 0 }}>
        <CodeEditor
          title="التعليمات"
          lang="markdown"
          size="full"
          value={value}
          onChange={setValue}
          onChangeComplete={(agentInstructions) => {
            executeRuntimeMutation({
              id: "projectSettings.update",
              input: { meta: { agentInstructions } },
            });
          }}
        />
      </Grid>
    </Grid>
  );
};
