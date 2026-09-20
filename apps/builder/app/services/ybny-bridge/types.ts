/**
 * YBNY Dual-Studio Bridge Types
 * Unifies ybny.net (Visual Studio) <---> ybnyai.com (AI & Code Studio)
 */

export type YbnySyncDirection = "to_ai" | "from_ai" | "bidirectional";

export type YbnyVirtualFile = {
  path: string;
  content: string;
  updatedAt?: number;
  _isBinaryBase64?: boolean;
};

export type YbnyProjectMapping = {
  /** Project ID on ybny.net (Webstudio engine) */
  studioProjectId: string;
  /** Workspace ID on ybnyai.com (OSW Studio engine) */
  aiWorkspaceId: string;
  /** Project ID on ybnyai.com */
  aiProjectId: string;
  /** Last successful sync timestamp */
  lastSyncedAt?: number;
};

export type YbnySyncPayload = {
  mapping: YbnyProjectMapping;
  direction: YbnySyncDirection;
  files?: YbnyVirtualFile[];
  html?: string;
  css?: string;
};

export type YbnySyncResult = {
  success: boolean;
  syncedFilesCount: number;
  direction: YbnySyncDirection;
  timestamp: number;
  error?: string;
};
