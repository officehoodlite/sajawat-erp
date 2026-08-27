export const queryKeys = {
  lots: {
    all: ["lots"] as const,
    list: (page: number, limit: number, search: string) =>
      ["lots", "list", page, limit, search] as const,
    detail: (id: string) => ["lots", "detail", id] as const,
    summary: (id: string) => ["lots", "summary", id] as const,
  },
  models: {
    all: ["models"] as const,
    detail: (id: string) => ["models", "detail", id] as const,
    summary: (catalogModelId: string) => ["models", "summary", catalogModelId] as const,
  },
  products: {
    all: ["products"] as const,
    detail: (id: string) => ["products", "detail", id] as const,
    catalog: ["products", "catalog"] as const,
    catalogPicker: ["products", "catalog", "picker"] as const,
  },
  suppliers: {
    all: ["suppliers"] as const,
  },
  boards: {
    all: ["boards"] as const,
    materials: (page: number, limit: number, search: string) =>
      ["boards", "materials", page, limit, search] as const,
    stock: ["boards", "stock"] as const,
    purchases: (page: number, limit: number, search: string) =>
      ["boards", "purchases", page, limit, search] as const,
    consumption: (page: number, limit: number, search: string) =>
      ["boards", "consumption", page, limit, search] as const,
    inventories: (thicknessId?: string) =>
      ["boards", "inventories", thicknessId] as const,
    options: ["boards", "options"] as const,
    thicknessOptions: ["boards", "thickness-options"] as const,
  },
  paint: {
    all: ["paint"] as const,
    options: ["paint", "options"] as const,
    products: (page: number, limit: number, search: string) =>
      ["paint", "products", page, limit, search] as const,
    stock: ["paint", "stock"] as const,
    purchases: (page: number, limit: number, search: string, productId?: string) =>
      ["paint", "purchases", page, limit, search, productId] as const,
    consumption: (page: number, limit: number, search: string, productId?: string) =>
      ["paint", "consumption", page, limit, search, productId] as const,
  },
  hardware: {
    all: ["hardware"] as const,
    options: ["hardware", "options"] as const,
    products: (page: number, limit: number, search: string) =>
      ["hardware", "products", page, limit, search] as const,
    stock: ["hardware", "stock"] as const,
    purchases: (page: number, limit: number, search: string, productId?: string) =>
      ["hardware", "purchases", page, limit, search, productId] as const,
    consumption: (page: number, limit: number, search: string, productId?: string) =>
      ["hardware", "consumption", page, limit, search, productId] as const,
  },
  packing: {
    all: ["packing"] as const,
    options: ["packing", "options"] as const,
    products: (page: number, limit: number, search: string) =>
      ["packing", "products", page, limit, search] as const,
    stock: ["packing", "stock"] as const,
    purchases: (page: number, limit: number, search: string, productId?: string) =>
      ["packing", "purchases", page, limit, search, productId] as const,
    consumption: (page: number, limit: number, search: string, productId?: string) =>
      ["packing", "consumption", page, limit, search, productId] as const,
  },
  edgebinding: {
    all: ["edgebinding"] as const,
    options: ["edgebinding", "options"] as const,
    products: (page: number, limit: number, search: string) =>
      ["edgebinding", "products", page, limit, search] as const,
    stock: ["edgebinding", "stock"] as const,
    purchases: (page: number, limit: number, search: string, productId?: string) =>
      ["edgebinding", "purchases", page, limit, search, productId] as const,
    consumption: (page: number, limit: number, search: string, productId?: string) =>
      ["edgebinding", "consumption", page, limit, search, productId] as const,
  },
  glass: {
    all: ["glass"] as const,
    options: ["glass", "options"] as const,
    products: (page: number, limit: number, search: string) =>
      ["glass", "products", page, limit, search] as const,
    stock: ["glass", "stock"] as const,
    purchases: (page: number, limit: number, search: string, productId?: string) =>
      ["glass", "purchases", page, limit, search, productId] as const,
    consumption: (page: number, limit: number, search: string, productId?: string) =>
      ["glass", "consumption", page, limit, search, productId] as const,
  },
  production: {
    all: ["production"] as const,
    byDate: (date: string) => ["production", "date", date] as const,
    byLot: (lotId: string) => ["production", "lot", lotId] as const,
    byModel: (catalogModelId: string) => ["production", "model", catalogModelId] as const,
    lotLookup: (lotNumber: string) => ["production", "lot-lookup", lotNumber] as const,
    lotModels: (lotId: string) => ["production", "models", lotId] as const,
    suggestions: ["production", "suggestions"] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
  users: {
    all: ["users"] as const,
  },
};
