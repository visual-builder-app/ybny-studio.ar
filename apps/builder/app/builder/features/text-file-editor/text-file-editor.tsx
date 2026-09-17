import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type { Extension } from "@codemirror/state";
import { linter } from "@codemirror/lint";
import { getCollectionEntrySourceIssues } from "@webstudio-is/content-engine";
import { validateTextAssetSource } from "@webstudio-is/content-engine/mdx";
import { useContentCollections } from "~/builder/shared/assets/content-collections";
import { useStore } from "@nanostores/react";
import {
  PanelContent,
  Box,
  Button,
  cssVar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Flex,
  FloatingPanel,
  IconButton,
  rawTheme,
  Text,
  theme,
  toast,
  Tooltip,
} from "@webstudio-is/design-system";
import {
  BlockquoteIcon,
  BoldIcon,
  ChevronDownIcon,
  CheckboxCheckedIcon,
  HeadingIcon,
  ImageIcon,
  LinkIcon,
  ListIcon,
  MarkdownEmbedIcon,
  MinusIcon,
  RepeatGridIcon,
  SpinnerIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
} from "@webstudio-is/icons";
import {
  findBlockTemplates,
  formatAssetName,
  getMdxAssetSourceBlockInstanceIds,
  inspectMdxAssetSource,
  MdxAuthoredContentConflictError,
} from "@webstudio-is/project-build/runtime";
import { getJsxPropName } from "@webstudio-is/content-engine/jsx-attributes";
import {
  contentBlockMdxTemplateDescriptors,
  getAssetDisplayNameParts,
  getAssetUrl,
  getComponentJsxName,
  getContentBlockTemplateName,
  getHtmlTagFromInstance,
  getPagePath,
  isMdxFileAsset,
  type Asset,
  type WsComponentMeta,
} from "@webstudio-is/sdk";
import { CodeEditor } from "~/shared/code-editor";
import { EditorDialog, type EditorApi } from "~/shared/code-editor-base";
import {
  $assetFolders,
  $assets,
  $dataSources,
  $instances,
  $pages,
  $props,
  readBuilderStateStores,
} from "~/shared/sync/data-stores";
import { $authPermit, $registeredComponentMetas } from "~/shared/nano-states";
import { AssetManager } from "~/builder/shared/asset-manager";
import {
  AssetUpload,
  updateAssetContent,
  useAssets,
} from "~/builder/shared/assets";
import {
  UrlInput,
  type UrlInputValue,
} from "~/builder/features/settings-panel/controls/url";
import {
  getTextFileEditorExtensions,
  getMdxPersistenceFeedback,
  isMarkdownAsset,
  type MdxCompletionComponent,
  type MdxPersistenceFeedback,
  normalizeTextFileContent,
} from "./text-file-utils";
import { MarkdownSplitView } from "./markdown-preview";
import { getAssetContentBridge } from "~/shared/asset-content-bridge.client";
import { $externalContentRoots } from "~/shared/external-content-mutations";
import type { AssetContentSessionState } from "@webstudio-is/content-engine/asset-content-session";
import {
  replaceExternalContentAssetSource,
  retryExternalContentAsset,
} from "~/shared/external-content-roots";

type TextFileState =
  | { status: "loading" }
  | { status: "loaded"; content: string }
  | { status: "error" };

const getStaticMdxCompletionProps = (
  meta: WsComponentMeta | undefined,
  contentModeOnly = false
): MdxCompletionComponent["props"] =>
  Object.entries(meta?.props ?? {}).flatMap(([name, prop]) => {
    if (
      (contentModeOnly && prop.contentMode !== true) ||
      (prop.type !== "string" &&
        prop.type !== "number" &&
        prop.type !== "boolean")
    ) {
      return [];
    }
    const values = "options" in prop ? prop.options : undefined;
    return [
      {
        name,
        ...(Array.isArray(values) ? { values } : {}),
      },
    ];
  });

const getMdxEditorSourceBlockInstanceIds = (assetId: string) =>
  Array.from(
    new Set([
      ...getMdxAssetSourceBlockInstanceIds({
        assetId,
        state: readBuilderStateStores(),
      }),
      ...Array.from($externalContentRoots.get().values()).flatMap((root) =>
        root.assetId === assetId
          ? [root.sourceBlockInstanceId ?? root.blockInstanceId]
          : []
      ),
    ])
  );

const getMdxCompletionComponents = ({
  assetId,
  metas,
}: {
  assetId: string;
  metas: Map<string, WsComponentMeta>;
}): MdxCompletionComponent[] => {
  const components = new Map<string, MdxCompletionComponent>();
  const componentIds = Array.from(metas.keys());
  for (const [component, meta] of metas) {
    if (
      contentBlockMdxTemplateDescriptors.some(
        (descriptor) =>
          descriptor.kind === "component" && descriptor.component === component
      ) === false
    ) {
      continue;
    }
    const name = getComponentJsxName({
      component,
      components: componentIds,
    });
    if (name !== undefined) {
      components.set(name, {
        name,
        props: getStaticMdxCompletionProps(meta),
      });
    }
  }

  const state = readBuilderStateStores();
  const instances = state.instances ?? new Map();
  const propsByInstanceId = new Map<
    string,
    Array<{ name: string; type: "string" | "number" | "boolean" }>
  >();
  for (const prop of state.props?.values() ?? []) {
    if (
      prop.type !== "string" &&
      prop.type !== "number" &&
      prop.type !== "boolean"
    ) {
      continue;
    }
    const props = propsByInstanceId.get(prop.instanceId) ?? [];
    props.push({ name: prop.name, type: prop.type });
    propsByInstanceId.set(prop.instanceId, props);
  }
  const templates = new Map<string, MdxCompletionComponent>();
  for (const blockInstanceId of getMdxEditorSourceBlockInstanceIds(assetId)) {
    for (const [template] of findBlockTemplates({
      anchor: [blockInstanceId],
      instances,
    }) ?? []) {
      const name = getContentBlockTemplateName(template);
      const existing = templates.get(name);
      const meta = metas.get(template.component);
      const componentPropNames = new Set(Object.keys(meta?.props ?? {}));
      const acceptsHtmlAttributes =
        getHtmlTagFromInstance({
          instance: template,
          metas,
          props: state.props,
        }) !== undefined;
      const existingProps = (propsByInstanceId.get(template.id) ?? []).flatMap(
        (prop) => {
          const propMeta = meta?.props?.[prop.name];
          if (
            propMeta !== undefined &&
            (propMeta.contentMode !== true || propMeta.type !== prop.type)
          ) {
            return [];
          }
          return [
            {
              name: getJsxPropName({
                instancePropName: prop.name,
                acceptsHtmlAttributes,
                componentPropNames,
              }),
            },
          ];
        }
      );
      const props = new Map(
        [
          ...(existing?.props ?? []),
          ...getStaticMdxCompletionProps(meta, true),
          ...existingProps,
        ].map((prop) => [prop.name, prop] as const)
      );
      templates.set(name, { name, props: Array.from(props.values()) });
    }
  }
  for (const [name, template] of templates) {
    components.set(name, template);
  }
  return Array.from(components.values());
};

const markdownActions = [
  {
    label: "عريض",
    icon: <BoldIcon />,
    template: { prefix: "**", suffix: "**", placeholder: "نص عريض" },
  },
  {
    label: "مائل",
    icon: <TextItalicIcon />,
    template: { prefix: "_", suffix: "_", placeholder: "نص مائل" },
  },
  {
    label: "يتوسطه خط",
    icon: <TextStrikethroughIcon />,
    template: {
      prefix: "~~",
      suffix: "~~",
      placeholder: "نص يتوسطه خط",
    },
  },
  {
    label: "اقتباس",
    icon: <BlockquoteIcon />,
    template: { prefix: "> ", placeholder: "اقتباس" },
  },
  {
    label: "رمز ضمن السطر",
    icon: (
      <Text as="span" variant="mono">
        &lt;/&gt;
      </Text>
    ),
    template: { prefix: "`", suffix: "`", placeholder: "code" },
  },
  {
    label: "كتلة رموز",
    icon: (
      <Text as="span" variant="mono">
        ```
      </Text>
    ),
    template: {
      prefix: "\n\n```\n",
      suffix: "\n```\n\n",
      placeholder: "code",
    },
  },
  {
    label: "قائمة نقطية",
    icon: <ListIcon fill="currentColor" />,
    template: { prefix: "- ", placeholder: "عنصر قائمة" },
  },
  {
    label: "قائمة رقمية",
    icon: (
      <Text as="span" variant="mono">
        1.
      </Text>
    ),
    template: { prefix: "1. ", placeholder: "عنصر قائمة" },
  },
  {
    label: "قائمة مهام",
    icon: <CheckboxCheckedIcon />,
    template: { prefix: "- [ ] ", placeholder: "مهمة" },
  },
  {
    label: "فاصل أفقي",
    icon: <MinusIcon />,
    template: { prefix: "\n\n---\n\n", placeholder: "" },
  },
  {
    label: "جدول",
    icon: <RepeatGridIcon />,
    template: {
      prefix: "\n\n| العمود 1 | العمود 2 |\n| --- | --- |\n| ",
      suffix: " | القيمة |\n\n",
      placeholder: "القيمة",
    },
  },
];

const headingLevels = [1, 2, 3, 4, 5, 6] as const;

const MarkdownHeadingMenu = ({
  editorApiRef,
  disabled,
}: {
  editorApiRef: RefObject<EditorApi | undefined>;
  disabled: boolean;
}) => (
  <DropdownMenu>
    <Tooltip content="عنوان">
      <DropdownMenuTrigger asChild>
        <IconButton
          type="button"
          aria-label="عنوان"
          disabled={disabled}
          css={{ gap: theme.spacing[1], paddingInline: theme.spacing[2] }}
        >
          <HeadingIcon />
          <ChevronDownIcon size={12} />
        </IconButton>
      </DropdownMenuTrigger>
    </Tooltip>
    <DropdownMenuContent
      align="start"
      sideOffset={4}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        editorApiRef.current?.focus();
      }}
    >
      {headingLevels.map((level) => (
        <DropdownMenuItem
          key={level}
          withIndicator={false}
          onSelect={() =>
            editorApiRef.current?.insertTemplate({
              prefix: `${"#".repeat(level)} `,
              placeholder: `عنوان ${level}`,
            })
          }
        >
          عنوان {level}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

const MarkdownImagePicker = ({
  editorApiRef,
  disabled,
}: {
  editorApiRef: RefObject<EditorApi | undefined>;
  disabled: boolean;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <FloatingPanel
      title="الصور"
      titleSuffix={<AssetUpload type="image" accept="image/*" />}
      placement="bottom-within"
      open={open}
      onOpenChange={setOpen}
      content={
        <AssetManager
          accept="image/*"
          onChange={(assetId) => {
            editorApiRef.current?.insertTemplate({
              prefix: "![",
              suffix: `](${assetId})`,
              placeholder: "نص بديل",
            });
            setOpen(false);
          }}
        />
      }
    >
      <IconButton
        type="button"
        aria-label="صورة"
        title="صورة"
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
      >
        <ImageIcon />
      </IconButton>
    </FloatingPanel>
  );
};

export const __testing__ = {
  getMdxCompletionComponents,
};

const getMarkdownHref = (value: UrlInputValue) => {
  if (value.type === "string" || value.type === "asset") {
    return value.value;
  }

  const pages = $pages.get();
  if (pages === undefined) {
    return "";
  }

  const pageId =
    typeof value.value === "string" ? value.value : value.value.pageId;
  if (pages.pages.has(pageId) === false) {
    return "";
  }

  const url = new URL(getPagePath(pageId, pages), "https://any-valid.url");
  if (typeof value.value === "string") {
    return url.pathname;
  }

  const section = value.value;
  const idProp = Array.from($props.get().values()).find(
    (prop) => prop.instanceId === section.instanceId && prop.name === "id"
  );
  if (idProp?.type === "string") {
    url.hash = encodeURIComponent(idProp.value);
  }
  return `${url.pathname}${url.hash}`;
};

const initialLinkValue: UrlInputValue = { type: "string", value: "" };

const MarkdownLinkPicker = ({
  editorApiRef,
  disabled,
}: {
  editorApiRef: RefObject<EditorApi | undefined>;
  disabled: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<UrlInputValue>(initialLinkValue);
  const valueRef = useRef<UrlInputValue>(initialLinkValue);

  return (
    <FloatingPanel
      title="رابط"
      placement="bottom-within"
      open={open}
      onOpenChange={(open) => {
        if (open) {
          valueRef.current = initialLinkValue;
          setValue(initialLinkValue);
        }
        setOpen(open);
      }}
      content={
        open && (
          <PanelContent as={Flex} direction="column" gap={5}>
            <UrlInput
              instanceId="markdown-link"
              prop={value}
              value={value.type === "string" ? value.value : ""}
              onChange={(value) => {
                valueRef.current = value;
                setValue(value);
              }}
            />
            <Flex justify="end">
              <Button
                color="primary"
                type="button"
                onClick={() => {
                  const href = getMarkdownHref(valueRef.current);
                  if (href === "") {
                    return;
                  }
                  editorApiRef.current?.insertTemplate({
                    prefix: "[",
                    suffix: `](${href})`,
                    placeholder: "نص الرابط",
                  });
                  setOpen(false);
                }}
              >
                إدراج رابط
              </Button>
            </Flex>
          </PanelContent>
        )
      }
    >
      <IconButton
        type="button"
        aria-label="رابط"
        title="رابط"
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
      >
        <LinkIcon />
      </IconButton>
    </FloatingPanel>
  );
};

const MarkdownToolbar = ({
  editorApiRef,
  disabled,
  previewOpen,
  onPreviewOpenChange,
}: {
  editorApiRef: RefObject<EditorApi | undefined>;
  disabled: boolean;
  previewOpen: boolean;
  onPreviewOpenChange: (open: boolean) => void;
}) => (
  <Flex
    role="toolbar"
    aria-label="تنسيق Markdown"
    align="center"
    gap={2}
    css={{
      padding: theme.spacing[3],
      borderBottom: `1px solid ${cssVar("--border-default")}`,
      overflow: "hidden",
      flexShrink: 0,
      background: cssVar("--background-primary"),
    }}
  >
    <Flex
      align="center"
      gap={2}
      css={{
        flex: 1,
        overflowX: "auto",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      <MarkdownHeadingMenu editorApiRef={editorApiRef} disabled={disabled} />
      {markdownActions.map(({ label, icon, template }) => (
        <Tooltip key={label} content={label}>
          <IconButton
            type="button"
            aria-label={label}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editorApiRef.current?.insertTemplate(template)}
          >
            {icon}
          </IconButton>
        </Tooltip>
      ))}
      <MarkdownLinkPicker editorApiRef={editorApiRef} disabled={disabled} />
      <MarkdownImagePicker editorApiRef={editorApiRef} disabled={disabled} />
    </Flex>
    <Tooltip content={previewOpen ? "إخفاء المعاينة" : "إظهار المعاينة"}>
      <IconButton
        type="button"
        aria-label={previewOpen ? "إخفاء المعاينة" : "إظهار المعاينة"}
        aria-pressed={previewOpen}
        variant={previewOpen ? "local" : "default"}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onPreviewOpenChange(previewOpen === false)}
      >
        <MarkdownEmbedIcon />
      </IconButton>
    </Tooltip>
  </Flex>
);

export const MarkdownEditor = ({
  asset,
  ariaLabel = "مصدر Markdown",
  defaultPreviewOpen = true,
  autoFocus = false,
  value,
  readOnly,
  languageExtensions = [],
  onChange,
  onChangeComplete,
}: {
  asset: Asset;
  ariaLabel?: string;
  defaultPreviewOpen?: boolean;
  autoFocus?: boolean;
  value: string;
  readOnly: boolean;
  languageExtensions?: Extension[];
  onChange: (value: string) => void;
  onChangeComplete: (value: string) => void;
}) => {
  const assetFolders = useStore($assetFolders);
  const { assetContainers } = useAssets();
  const [previewOpen, setPreviewOpen] = useState(defaultPreviewOpen);
  const editorApiRef = useRef<EditorApi>();

  return (
    <Box
      css={{
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        height: "100%",
        minHeight: 0,
      }}
    >
      <MarkdownToolbar
        editorApiRef={editorApiRef}
        disabled={readOnly}
        previewOpen={previewOpen}
        onPreviewOpenChange={setPreviewOpen}
      />
      <MarkdownSplitView
        open={previewOpen}
        source={value}
        sourceAsset={asset}
        folders={assetFolders}
        assetContainers={assetContainers}
      >
        <CodeEditor
          autoFocus={autoFocus}
          ariaLabel={ariaLabel}
          editorApiRef={editorApiRef}
          value={value}
          languageExtensions={languageExtensions}
          size="full"
          expandable={false}
          chromeless
          readOnly={readOnly}
          onChange={onChange}
          onChangeComplete={onChangeComplete}
        />
      </MarkdownSplitView>
    </Box>
  );
};

export const TextFileEditor = ({
  assetId,
  onOpenChange,
  readOnly = false,
}: {
  assetId: string;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
}) => {
  const assets = useStore($assets);
  const externalContentRoots = useStore($externalContentRoots);
  const registeredComponentMetas = useStore($registeredComponentMetas);
  const instances = useStore($instances);
  const props = useStore($props);
  const dataSources = useStore($dataSources);
  const asset = assets.get(assetId);
  const collections = useContentCollections(asset?.folderId);
  const collection =
    asset?.folderId === undefined ? undefined : collections.get(asset.folderId);
  const canEdit = useStore($authPermit) !== "view" && readOnly === false;
  const [state, setState] = useState<TextFileState>({ status: "loading" });
  const [persistenceFeedback, setPersistenceFeedback] =
    useState<MdxPersistenceFeedback>();
  const currentAssetRef = useRef<Asset>();
  const persistedContentRef = useRef<string>();
  const requestedContentRef = useRef<string>();
  const pendingMdxSavesRef = useRef(0);
  const saveQueueRef = useRef(Promise.resolve());
  const reportedConflictRef = useRef<string>();
  const saveAttemptRef = useRef(0);
  const mdxSession =
    asset !== undefined &&
    isMdxFileAsset(asset) &&
    asset.projectId !== undefined
      ? getAssetContentBridge().getContentSession?.(asset.projectId)
      : undefined;
  const languageExtensions = useMemo(
    () => {
      // The state reader below is intentionally refreshed when its external
      // Content Block context or template definitions change.
      void externalContentRoots;
      void instances;
      void props;
      void dataSources;
      if (asset === undefined) {
        return [];
      }
      if (isMdxFileAsset(asset) === false || asset.projectId === undefined) {
        return getTextFileEditorExtensions(asset);
      }
      const projectId = asset.projectId;
      const extensions = getTextFileEditorExtensions(
        asset,
        [],
        async ({ source }) =>
          inspectMdxAssetSource({
            source,
            assetId,
            sourceBlockInstanceIds: getMdxEditorSourceBlockInstanceIds(assetId),
            state: readBuilderStateStores(),
            metas: registeredComponentMetas,
            projectId,
          }),
        getMdxCompletionComponents({
          assetId,
          metas: registeredComponentMetas,
        })
      );
      if (
        collection?.status === "ready" &&
        collection.config.matchesEntry(formatAssetName(asset))
      ) {
        extensions.push(
          linter(async (view) => {
            try {
              return (
                await getCollectionEntrySourceIssues({
                  config: collection.config,
                  source: view.state.doc.toString(),
                  basename: getAssetDisplayNameParts(asset).basename,
                })
              ).map(({ from, to, message }) => ({
                from,
                to,
                message,
                severity: "error" as const,
                source: "collection-field",
              }));
            } catch {
              // The Markdown linter already reports malformed frontmatter.
              return [];
            }
          })
        );
      }
      return extensions;
    },
    // Recreate the linter after a Content Block is materialized or refreshed so
    // contextual template and content-model diagnostics are recalculated.
    [
      asset,
      assetId,
      collection,
      dataSources,
      externalContentRoots,
      instances,
      props,
      registeredComponentMetas,
    ]
  );

  useEffect(() => {
    const assetToLoad = $assets.get().get(assetId);
    if (assetToLoad === undefined) {
      setState({ status: "error" });
      return;
    }
    currentAssetRef.current = assetToLoad;

    const controller = new AbortController();
    setState({ status: "loading" });
    setPersistenceFeedback(undefined);
    reportedConflictRef.current = undefined;

    const applySessionState = (sessionState: AssetContentSessionState) => {
      const feedback = getMdxPersistenceFeedback(sessionState);
      setPersistenceFeedback(feedback);
      if (
        feedback?.kind === "conflicting" &&
        reportedConflictRef.current !== feedback.message
      ) {
        reportedConflictRef.current = feedback.message;
        getAssetContentBridge().requireReload(feedback.message);
      }
      if (feedback?.kind !== "conflicting") {
        reportedConflictRef.current = undefined;
      }
    };

    const load = async () => {
      try {
        if (isMdxFileAsset(assetToLoad)) {
          const session = getAssetContentBridge().getContentSession?.(
            assetToLoad.projectId
          );
          if (session === undefined) {
            throw new Error("جلسة محتوى MDX غير متاحة");
          }
          const opened = await session.open(assetId);
          if (controller.signal.aborted) {
            return;
          }
          currentAssetRef.current = assetToLoad;
          persistedContentRef.current = opened.source;
          requestedContentRef.current = opened.source;
          applySessionState(opened);
          setState({ status: "loaded", content: opened.source });
          return;
        }
        const response = await fetch(
          getAssetUrl(assetToLoad, window.location.origin),
          { signal: controller.signal }
        );
        if (response.ok === false) {
          throw new Error(`تعذّر تحميل الوسيط: ${response.status}`);
        }
        const content = await response.text();
        persistedContentRef.current = content;
        setState({ status: "loaded", content });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setState({ status: "error" });
        toast.error(
          error instanceof Error ? error.message : "تعذّر تحميل الوسيط"
        );
      }
    };

    void load();
    const unsubscribe = isMdxFileAsset(assetToLoad)
      ? getAssetContentBridge()
          .getContentSession?.(assetToLoad.projectId)
          .subscribe((changedAssetId, sessionState) => {
            if (changedAssetId !== assetId || controller.signal.aborted) {
              return;
            }
            currentAssetRef.current = sessionState.asset as Asset;
            persistedContentRef.current = sessionState.source;
            applySessionState(sessionState);
            if (requestedContentRef.current === sessionState.source) {
              return;
            }
            if (pendingMdxSavesRef.current > 0) {
              return;
            }
            requestedContentRef.current = sessionState.source;
            setState({ status: "loaded", content: sessionState.source });
          })
      : undefined;
    return () => {
      saveAttemptRef.current += 1;
      controller.abort();
      unsubscribe?.();
    };
  }, [assetId]);

  const save = async (content: string) => {
    const attempt = ++saveAttemptRef.current;
    if (canEdit === false) {
      return true;
    }
    const currentAsset = currentAssetRef.current;
    if (currentAsset === undefined) {
      toast.error("تعذّر الحفظ: الوسيط غير موجود");
      return false;
    }
    const normalized = normalizeTextFileContent(currentAsset, content);
    if ("error" in normalized) {
      toast.error(normalized.error);
      return false;
    }
    const normalizedContent = normalized.content;
    if (isMdxFileAsset(currentAsset)) {
      const { diagnostics } = await validateTextAssetSource({
        source: normalizedContent,
        format: "mdx",
      });
      if (attempt !== saveAttemptRef.current) {
        return false;
      }
      const error = diagnostics.find(({ severity }) => severity === "error");
      if (error !== undefined) {
        setPersistenceFeedback({ kind: "invalid", message: error.message });
        return false;
      }
      setPersistenceFeedback((feedback) =>
        feedback?.kind === "invalid" ? undefined : feedback
      );
    }
    if (normalizedContent !== content) {
      setState({ status: "loaded", content: normalizedContent });
    }
    const expectedContent = requestedContentRef.current;
    requestedContentRef.current = normalizedContent;
    if (isMdxFileAsset(currentAsset) && mdxSession !== undefined) {
      if (
        expectedContent === undefined ||
        currentAsset.projectId === undefined
      ) {
        toast.error("تعذّر الحفظ: لم يتم تحميل محتوى MDX");
        return false;
      }
      pendingMdxSavesRef.current += 1;
      void replaceExternalContentAssetSource({
        projectId: currentAsset.projectId,
        assetId,
        expectedSource: expectedContent,
        source: normalizedContent,
      })
        .catch((error) => {
          const message =
            error instanceof Error
              ? error.message
              : "تعذّر حفظ هذا الملف.";
          const feedback: MdxPersistenceFeedback = {
            kind:
              error instanceof MdxAuthoredContentConflictError
                ? "conflicting"
                : "failed",
            message,
          };
          setPersistenceFeedback(feedback);
        })
        .finally(() => {
          pendingMdxSavesRef.current -= 1;
        });
      return true;
    }
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      const requestedContent = requestedContentRef.current;
      if (
        requestedContent === undefined ||
        requestedContent === persistedContentRef.current
      ) {
        return;
      }

      const assetToUpdate = currentAssetRef.current;
      if (assetToUpdate === undefined) {
        toast.error("تعذّر الحفظ: الوسيط غير موجود");
        return;
      }

      try {
        const updatedAsset = await updateAssetContent({
          asset: assetToUpdate,
          content: requestedContent,
        });
        currentAssetRef.current = updatedAsset;
        persistedContentRef.current = requestedContent;
        toast.success("تم حفظ الملف بنجاح");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر الحفظ");
      }
    });
    return true;
  };

  const title = asset === undefined ? "ملف نصي" : formatAssetName(asset);
  const isMarkdown = asset !== undefined && isMarkdownAsset(asset);
  let editor: ReactNode;
  if (state.status === "loaded" && asset !== undefined) {
    const onChange = (content: string) => {
      saveAttemptRef.current += 1;
      setState({ status: "loaded", content });
    };
    editor = isMarkdown ? (
      <MarkdownEditor
        autoFocus
        asset={asset}
        value={state.content}
        readOnly={canEdit === false}
        languageExtensions={languageExtensions}
        onChange={onChange}
        onChangeComplete={save}
      />
    ) : (
      <CodeEditor
        autoFocus
        value={state.content}
        languageExtensions={languageExtensions}
        size="full"
        expandable={false}
        chromeless
        readOnly={canEdit === false}
        onChange={onChange}
        onChangeComplete={save}
      />
    );
  }

  return (
    <EditorDialog
      title={title}
      contentPadding={false}
      width={isMarkdown ? 1280 : undefined}
      height={isMarkdown ? 960 : undefined}
      open
      onOpenChange={(open) => {
        if (open === false && state.status === "loaded") {
          void save(state.content).then((saved) => {
            if (saved) {
              onOpenChange(false);
            }
          });
          return;
        }
        onOpenChange(open);
      }}
      content={
        <Box
          data-floating-panel-container
          css={{ height: "100%", minHeight: 0 }}
        >
          {state.status === "loading" && (
            <Flex align="center" justify="center" css={{ height: "100%" }}>
              <SpinnerIcon size={rawTheme.spacing[15]} />
            </Flex>
          )}
          {state.status === "error" && (
            <Flex align="center" justify="center" css={{ height: "100%" }}>
              <Text color="subtle">تعذّر تحميل هذا الملف.</Text>
            </Flex>
          )}
          {state.status === "loaded" && asset !== undefined && (
            <Box
              css={{
                display: "grid",
                gridTemplateRows:
                  persistenceFeedback === undefined
                    ? "minmax(0, 1fr)"
                    : "auto minmax(0, 1fr)",
                height: "100%",
              }}
            >
              {persistenceFeedback !== undefined && (
                <Flex
                  gap="2"
                  align="center"
                  css={{ padding: rawTheme.spacing[5] }}
                >
                  <Text role="alert" color="destructive">
                    {persistenceFeedback.message}
                  </Text>
                  {persistenceFeedback.kind === "invalid" && (
                    <Button
                      color="ghost"
                      onClick={() => {
                        saveAttemptRef.current += 1;
                        onOpenChange(false);
                      }}
                    >
                      تجاهل التغييرات
                    </Button>
                  )}
                  {persistenceFeedback.kind === "failed" &&
                    mdxSession !== undefined && (
                      <Button
                        color="ghost"
                        onClick={() => {
                          void retryExternalContentAsset({
                            projectId: asset.projectId!,
                            assetId,
                          }).catch((error) => {
                            setPersistenceFeedback({
                              kind: "failed",
                              message:
                                error instanceof Error
                                  ? error.message
                                  : "تعذّر حفظ هذا الملف.",
                            });
                          });
                        }}
                      >
                        إعادة المحاولة
                      </Button>
                    )}
                </Flex>
              )}
              {editor}
            </Box>
          )}
        </Box>
      }
    >
      <button type="button" hidden tabIndex={-1} />
    </EditorDialog>
  );
};
