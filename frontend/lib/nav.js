import {
  LayoutGrid,
  BookOpen,
  Receipt,
  Boxes,
  BarChart3,
  Landmark,
  Users,
  Percent,
  Wrench,
  ShieldCheck,
} from "lucide-react";

export const NAV = [
  { type: "link", href: "/dashboard", label: "Gateway", icon: LayoutGrid },
  {
    type: "group",
    label: "Masters",
    icon: BookOpen,
    items: [
      { href: "/dashboard/masters/customers", label: "Customer Ledgers" },
      { href: "/dashboard/masters/suppliers", label: "Supplier Ledgers" },
      { href: "/dashboard/masters/stock-items", label: "Stock Items" },
    ],
  },
  {
    type: "group",
    label: "Vouchers",
    icon: Receipt,
    items: [
      { href: "/dashboard/vouchers/sales", label: "Sales / Customer Bill" },
      { href: "/dashboard/vouchers/purchase", label: "Purchase Entry" },
    ],
  },
  { type: "link", href: "/dashboard/inventory", label: "Inventory", icon: Boxes },
  {
    type: "group",
    label: "Reports",
    icon: BarChart3,
    items: [
      { href: "/dashboard/reports/stock-summary", label: "Stock Summary" },
      { href: "/dashboard/reports/sales-register", label: "Sales Register" },
      { href: "/dashboard/reports/customer-statement", label: "Customer Statement" },
      { href: "/dashboard/reports/gst-summary", label: "GST Summary" },
    ],
  },
  { type: "link", href: "/dashboard/banking", label: "Banking", icon: Landmark, roadmap: true },
  { type: "link", href: "/dashboard/payroll", label: "Payroll", icon: Users, roadmap: true },
  { type: "link", href: "/dashboard/gst", label: "GST", icon: Percent },
  { type: "link", href: "/dashboard/utilities", label: "Utilities", icon: Wrench },
  { type: "link", href: "/dashboard/admin", label: "Administration", icon: ShieldCheck },
];

// Flat list used by the command palette (Ctrl+K)
export const COMMANDS = [
  { href: "/dashboard", label: "Gateway / Home", group: "Navigate" },
  { href: "/dashboard/masters/customers", label: "Customer Ledgers", group: "Masters" },
  { href: "/dashboard/masters/suppliers", label: "Supplier Ledgers", group: "Masters" },
  { href: "/dashboard/masters/stock-items", label: "Stock Items", group: "Masters" },
  { href: "/dashboard/vouchers/sales/new", label: "New Sales Voucher", group: "Create", shortcut: "F8" },
  { href: "/dashboard/vouchers/purchase/new", label: "New Purchase Voucher", group: "Create", shortcut: "F9" },
  { href: "/dashboard/vouchers/sales", label: "Sales Vouchers", group: "Vouchers" },
  { href: "/dashboard/vouchers/purchase", label: "Purchase Vouchers", group: "Vouchers" },
  { href: "/dashboard/inventory", label: "Inventory Dashboard", group: "Inventory" },
  { href: "/dashboard/reports/stock-summary", label: "Stock Summary Report", group: "Reports" },
  { href: "/dashboard/reports/sales-register", label: "Sales Register Report", group: "Reports" },
  { href: "/dashboard/reports/customer-statement", label: "Customer Statement", group: "Reports" },
  { href: "/dashboard/reports/gst-summary", label: "GST Summary", group: "Reports" },
  { href: "/dashboard/admin", label: "Administration", group: "Settings" },
  { href: "/dashboard/utilities", label: "Utilities & Export", group: "Settings" },
  { href: "/companies", label: "Switch Company", group: "Settings", shortcut: "F1" },
];
