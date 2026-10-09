const adapter = {
  version: 1 as const,
  level: 1 as const,
  site: {
    id: "sample",
    name: "Sample",
    productionUrl: "https://example.com",
    repository: { owner: "example", name: "sample" },
    defaultBranch: "dev",
  },
};

export default adapter;
