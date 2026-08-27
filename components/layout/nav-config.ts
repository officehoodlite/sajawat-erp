import {
  ClipboardList,
  Factory,
  Layers,
  Package,
  Paintbrush,
  Scissors,
  AppWindow,
  ShoppingBag,
  Truck,
  Users,
  Wrench,
  Workflow,
} from "lucide-react";

export const navSections = [
  {
    label: "Manufacturing",
    items: [
      { href: "/manufacturing", label: "Lots", icon: Factory },
      { href: "/production", label: "Production", icon: Workflow },
      { href: "/model-summary", label: "Model Summary", icon: ClipboardList },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/products", label: "Products", icon: ShoppingBag },
      { href: "/suppliers", label: "Suppliers", icon: Truck },
    ],
  },
  {
    label: "Inventory",
    items: [
      { href: "/inventory/boards", label: "Boards", icon: Layers },
      { href: "/inventory/paint", label: "Paint", icon: Paintbrush },
      { href: "/inventory/hardware", label: "Hardware", icon: Wrench },
      { href: "/inventory/packing", label: "Packing", icon: Package },
      { href: "/inventory/edge-binding", label: "Edge Binding", icon: Scissors },
      { href: "/inventory/glass", label: "Glass", icon: AppWindow },
    ],
  },
  {
    label: "Admin",
    items: [{ href: "/users", label: "Users", icon: Users, adminOnly: true as const }],
  },
] as const;

export type NavItem = (typeof navSections)[number]["items"][number];

/** Flat list for callers that only need href matching. */
export const navItems: NavItem[] = navSections.flatMap((section) => [...section.items]);
