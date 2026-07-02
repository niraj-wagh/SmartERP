"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Select, Input } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

export default function VoucherItemsEditor({ stockItems, priceField, items, onChange }) {
  const [pendingItemId, setPendingItemId] = useState("");

  function addItem() {
    const stock = stockItems.find((s) => s.id === pendingItemId);
    if (!stock) return;
    const rate = Number(stock[priceField] || 0);
    onChange([
      ...items,
      {
        key: `${stock.id}-${Date.now()}`,
        stock_item_id: stock.id,
        item_name: stock.name,
        unit: stock.unit,
        availableQty: stock.quantity,
        qty: 1,
        rate,
        gst_percent: stock.gst_percent || 0,
      },
    ]);
    setPendingItemId("");
  }

  function updateRow(idx, patch) {
    const next = items.slice();
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  }

  function removeRow(idx) {
    onChange(items.filter((_, i) => i !== idx));
  }

  const subtotal = items.reduce((s, i) => s + Number(i.qty || 0) * Number(i.rate || 0), 0);
  const gstAmount = items.reduce(
    (s, i) => s + (Number(i.qty || 0) * Number(i.rate || 0) * Number(i.gst_percent || 0)) / 100,
    0
  );
  const total = subtotal + gstAmount;

  const available = stockItems.filter((s) => !items.some((i) => i.stock_item_id === s.id));

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Select value={pendingItemId} onChange={(e) => setPendingItemId(e.target.value)} className="flex-1">
          <option value="">Select a stock item to add…</option>
          {available.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.quantity} {s.unit} in stock
            </option>
          ))}
        </Select>
        <Button type="button" icon={Plus} variant="secondary" onClick={addItem} disabled={!pendingItemId}>
          Add
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-hair rounded-lg py-10 text-center text-sm text-paper-faint">
          No line items yet — add a stock item above.
        </div>
      ) : (
        <div className="border border-hair rounded-lg overflow-hidden">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="w-24">Qty</th>
                <th className="w-28">Rate ₹</th>
                <th className="w-20">GST %</th>
                <th className="w-28 text-right">Amount</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => {
                const amount = Number(row.qty || 0) * Number(row.rate || 0);
                const overStock =
                  priceField === "selling_price" && Number(row.qty) > Number(row.availableQty ?? Infinity);
                return (
                  <tr key={row.key}>
                    <td>
                      <div className="text-paper">{row.item_name}</div>
                      {overStock && (
                        <p className="text-[10px] text-red mt-0.5">
                          Only {row.availableQty} {row.unit} in stock
                        </p>
                      )}
                    </td>
                    <td>
                      <Input
                        type="number" min="0" step="0.01"
                        value={row.qty}
                        onChange={(e) => updateRow(idx, { qty: e.target.value })}
                        className={"!py-1 " + (overStock ? "border-red" : "")}
                      />
                    </td>
                    <td>
                      <Input
                        type="number" min="0" step="0.01"
                        value={row.rate}
                        onChange={(e) => updateRow(idx, { rate: e.target.value })}
                        className="!py-1"
                      />
                    </td>
                    <td>
                      <Input
                        type="number" min="0" step="0.01"
                        value={row.gst_percent}
                        onChange={(e) => updateRow(idx, { gst_percent: e.target.value })}
                        className="!py-1"
                      />
                    </td>
                    <td className="text-right num">{formatCurrency(amount)}</td>
                    <td>
                      <button type="button" onClick={() => removeRow(idx)} className="p-1 text-paper-faint hover:text-red">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <div className="w-64 space-y-1.5">
          <div className="flex justify-between text-sm text-paper-dim">
            <span>Subtotal</span>
            <span className="num">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-paper-dim">
            <span>GST</span>
            <span className="num">{formatCurrency(gstAmount)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-paper pt-1.5 border-t border-hair">
            <span>Total</span>
            <span className="num">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
