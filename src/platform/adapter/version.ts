export const supportedAdapterVersions = [1] as const;

export type SupportedAdapterVersion = (typeof supportedAdapterVersions)[number];
