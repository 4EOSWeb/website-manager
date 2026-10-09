"use client";

import { createContext, useContext } from "react";

const EditorPreviewContext = createContext(false);

export function EditorPreviewProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  return <EditorPreviewContext.Provider value={enabled}>{children}</EditorPreviewContext.Provider>;
}

export function useEditorPreview() {
  return useContext(EditorPreviewContext);
}
