"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type RoadmapItem = {
  id: string;
  title: string;
  description?: string;
  column: "now" | "next" | "later";
};

const COLUMNS = [
  { id: "now" as const, label: "Now", color: "bg-emerald-500/10 border-emerald-500/30" },
  { id: "next" as const, label: "Next", color: "bg-amber-500/10 border-amber-500/30" },
  { id: "later" as const, label: "Later", color: "bg-slate-500/10 border-slate-500/30" },
];

export function RoadmapBuilder() {
  const [items, setItems] = useState<RoadmapItem[]>([
    { id: "1", title: "Onboarding redesign", column: "now" },
    { id: "2", title: "Dark mode", column: "now" },
    { id: "3", title: "Bulk CSV export", column: "next" },
    { id: "4", title: "API access", column: "later" },
  ]);

  const moveItem = (id: string, newColumn: "now" | "next" | "later") => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, column: newColumn } : i))
    );
  };

  const addItem = (column: "now" | "next" | "later") => {
    setItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        title: "New initiative",
        column,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Roadmap Builder</h2>
        <p className="text-sm text-muted-foreground">
          Drag items between Now / Next / Later columns
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <Card key={col.id} className={cn("border-2", col.color)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{col.label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => addItem(col.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {items
                .filter((i) => i.column === col.id)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-lg border bg-background p-2 text-sm cursor-move hover:bg-muted/50"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("id", item.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const id = e.dataTransfer.getData("id");
                      if (id) moveItem(id, col.id);
                    }}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    {item.title}
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
