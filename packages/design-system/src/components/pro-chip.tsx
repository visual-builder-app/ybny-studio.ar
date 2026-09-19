import type { ReactNode } from "react";
import type { CSS } from "../stitches.config";
import { Chip } from "./chip";

export const ProChip = ({
  css,
  children,
}: {
  children: ReactNode;
  css?: CSS;
}) => {
  return <Chip css={css}>{children}</Chip>;
};
