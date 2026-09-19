/** @jsxImportSource @webstudio-is/template */
/** Assembles core templates that depend on registered React components. */
import { createElement, type ElementType } from "react";
import {
  blockComponent,
  contentBlockDocumentProp,
  contentBlockMdxTemplateDescriptors,
  elementComponent,
  getDefaultContentBlockTemplateName,
  type ContentBlockMdxTemplateDescriptor,
} from "@webstudio-is/sdk";
import { intrinsicCoreTemplates } from "@webstudio-is/sdk/core-templates";
import {
  Parameter,
  setInstanceMeta,
  setTemplateMeta,
  type TemplateMeta,
  ws,
} from "@webstudio-is/template";
import {
  CodeText,
  HtmlEmbed,
} from "@webstudio-is/sdk-components-react/components";
import { componentsById } from "./components";

const BlockTemplate = ws.blockTemplate;
const blockDocument = new Parameter(contentBlockDocumentProp);

const listItemMdxTemplateDescriptor = contentBlockMdxTemplateDescriptors.find(
  ({ resolutionKey }) => resolutionKey === "element:li"
);
if (listItemMdxTemplateDescriptor?.kind !== "element") {
  throw new Error("Expected the Content Block list item template descriptor");
}

const createContentBlockMdxTemplate = (
  descriptor: ContentBlockMdxTemplateDescriptor
) => {
  if (descriptor.kind === "element") {
    const name = getDefaultContentBlockTemplateName({
      component: elementComponent,
      tag: descriptor.tag,
    });
    if (descriptor.tag === "ul" || descriptor.tag === "ol") {
      return setTemplateMeta(
        { name, label: descriptor.label },
        createElement(
          descriptor.tag,
          { key: descriptor.resolutionKey },
          createElement(listItemMdxTemplateDescriptor.tag)
        )
      );
    }
    return setTemplateMeta(
      { name, label: descriptor.label },
      createElement(descriptor.tag, { key: descriptor.resolutionKey })
    );
  }

  const component = componentsById.get(descriptor.component);
  if (component === undefined) {
    throw new Error(
      `Content Block component template "${descriptor.component}" is not registered`
    );
  }
  return setTemplateMeta(
    {
      name: getDefaultContentBlockTemplateName({
        component: descriptor.component,
      }),
      label: descriptor.label,
    },
    createElement(
      component as ElementType,
      { key: descriptor.resolutionKey },
      descriptor.component === "CodeText"
        ? 'const status = "ready";'
        : undefined
    )
  );
};

const contentBlockDefaultTemplates = contentBlockMdxTemplateDescriptors.flatMap(
  (descriptor) => [
    ...(descriptor.resolutionKey === "component:CodeText"
      ? [
          setTemplateMeta(
            { name: "HtmlEmbed" },
            <HtmlEmbed key="custom:HtmlEmbed" />
          ),
        ]
      : []),
    createContentBlockMdxTemplate(descriptor),
  ]
);

const blockMeta: TemplateMeta = {
  category: "general",
  template: (
    <ws.block document={blockDocument}>
      {setInstanceMeta(
        { label: "Templates" },
        <BlockTemplate>{contentBlockDefaultTemplates}</BlockTemplate>
      )}
      <p>
        The Content Block component designates regions on the page where
        pre-styled instances can be inserted in Content mode.
      </p>
      <ul>
        <li>
          In Content mode, you can edit content inside this Content Block and
          add new instances predefined in templates. Content outside Content
          Blocks is read-only.
        </li>
        <li>
          To predefine instances for insertion in Content mode, switch to Design
          mode and add them to the Templates container.
        </li>
        <li>
          To insert predefined instances in Content mode, click the + button
          while hovering over the Content Block on the canvas and choose an
          instance from the list.
        </li>
      </ul>
    </ws.block>
  ),
};

export const coreTemplates = {
  ...intrinsicCoreTemplates,
  [blockComponent]: blockMeta,
  code_text: {
    category: "typography",
    template: <CodeText>{'const status = "ready";'}</CodeText>,
  },
} satisfies Record<string, TemplateMeta>;
