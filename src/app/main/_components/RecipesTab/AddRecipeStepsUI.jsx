"use client";

import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TrashIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

export function AddRecipeStepsUI({ control, register }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "steps",
  });

  const [expanded, setExpanded] = useState({});

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Инструкция</h3>

        <Button type="button" variant="outline" size="sm" onClick={() => append({ text: "" })}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Добавить шаг
        </Button>
      </div>

      <div className="grid gap-2">
        {fields.map((f, i) => {
          const isOpen = expanded[i] ?? true;

          return (
            <div key={f.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">Шаг {i + 1}</div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpanded((p) => ({ ...p, [i]: !isOpen }))}
                    title={isOpen ? "Свернуть" : "Развернуть"}
                  >
                    {isOpen ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(i)}
                    title="Удалить шаг"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div className="pt-2">
                  <Textarea
                    placeholder={`Опишите шаг ${i + 1}`}
                    className="min-h-[80px]"
                    {...register(`steps.${i}.text`)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
