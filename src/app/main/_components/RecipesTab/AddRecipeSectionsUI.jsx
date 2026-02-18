"use client";

import { useMemo, useState } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrashIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddRecipeSectionsUI({ control, register, products }) {
  const { fields: sectionFields, append: appendSection, remove: removeSection } =
    useFieldArray({
      control,
      name: "sections",
    });

  const [expanded, setExpanded] = useState({});

  const units = useMemo(() => ["г", "кг", "мл", "л", "шт"], []);

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Секции и ингредиенты</h3>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendSection({ title: "Новая секция", items: [] })}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Добавить секцию
        </Button>
      </div>

      <div className="grid gap-3">
        {sectionFields.map((section, sectionIndex) => {
          const isOpen = expanded[sectionIndex] ?? true;

          return (
            <div key={section.id} className="border rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 grid gap-2">
                  <Label>Название секции</Label>
                  <Input
                    placeholder='Например: "Крем — ингредиенты"'
                    {...register(`sections.${sectionIndex}.title`)}
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setExpanded((p) => ({ ...p, [sectionIndex]: !isOpen }))
                    }
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
                    onClick={() => removeSection(sectionIndex)}
                    title="Удалить секцию"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div className="mt-3">
                  <SectionItems
                    control={control}
                    register={register}
                    sectionIndex={sectionIndex}
                    products={products}
                    units={units}
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

function SectionItems({ control, register, sectionIndex, products, units }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.items`,
  });

  return (
    <div className="grid gap-2">
      {fields.map((item, itemIndex) => (
        <ItemRow
          key={item.id}
          control={control}
          register={register}
          sectionIndex={sectionIndex}
          itemIndex={itemIndex}
          products={products}
          units={units}
          onRemove={() => remove(itemIndex)}
        />
      ))}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              kind: "product",
              productId: "",
              qty: 0,
              unit: "г",
            })
          }
        >
          + Добавить ингредиент
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            append({
              kind: "compound",
              title: "Сложный ингредиент",
              children: [],
            })
          }
        >
          + Добавить сложный ингредиент
        </Button>
      </div>
    </div>
  );
}

function ItemRow({
  control,
  register,
  sectionIndex,
  itemIndex,
  products,
  units,
  onRemove,
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border rounded-md p-2">
      <div className="flex items-center justify-between gap-2">
        <Controller
          control={control}
          name={`sections.${sectionIndex}.items.${itemIndex}.kind`}
          render={({ field }) => {
            const kind = field.value;
            return (
              <div className="text-xs text-muted-foreground">
                {kind === "compound" ? "Сложный ингредиент" : "Ингредиент"}
              </div>
            );
          }}
        />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            title={open ? "Свернуть" : "Развернуть"}
          >
            {open ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </Button>

          <Button type="button" variant="ghost" size="icon" onClick={onRemove} title="Удалить">
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-2">
          <Controller
            control={control}
            name={`sections.${sectionIndex}.items.${itemIndex}.kind`}
            render={({ field }) => {
              const kind = field.value;

              if (kind === "compound") {
                return (
                  <CompoundItem
                    control={control}
                    register={register}
                    sectionIndex={sectionIndex}
                    itemIndex={itemIndex}
                    products={products}
                    units={units}
                  />
                );
              }

              return (
                <SimpleProductItem
                  control={control}
                  register={register}
                  sectionIndex={sectionIndex}
                  itemIndex={itemIndex}
                  products={products}
                  units={units}
                />
              );
            }}
          />
        </div>
      )}
    </div>
  );
}

function SimpleProductItem({ control, register, sectionIndex, itemIndex, products, units }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_140px_120px] items-end">
      <div className="grid gap-1">
        <Label className="text-xs text-muted-foreground">Продукт</Label>
        <Controller
          control={control}
          name={`sections.${sectionIndex}.items.${itemIndex}.productId`}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите продукт" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.baseUnit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid gap-1">
        <Label className="text-xs text-muted-foreground">Требуется</Label>
        <Input
          type="number"
          min={0}
          step="any"
          placeholder="0"
          {...register(`sections.${sectionIndex}.items.${itemIndex}.qty`, { valueAsNumber: true })}
        />
      </div>

      <div className="grid gap-1">
        <Label className="text-xs text-muted-foreground">Ед.</Label>
        <Controller
          control={control}
          name={`sections.${sectionIndex}.items.${itemIndex}.unit`}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || "г"}>
              <SelectTrigger>
                <SelectValue placeholder="Ед." />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </div>
  );
}

function CompoundItem({ control, register, sectionIndex, itemIndex, products, units }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.items.${itemIndex}.children`,
  });

  return (
    <div className="grid gap-2">
      <div className="grid gap-1">
        <Label className="text-xs text-muted-foreground">Название сложного ингредиента</Label>
        <Input
          placeholder='Например: "Смесь специй"'
          {...register(`sections.${sectionIndex}.items.${itemIndex}.title`)}
        />
      </div>

      <div className="rounded-md bg-muted/40 p-2">
        <div className="text-xs font-medium mb-2">Состав</div>

        <div className="grid gap-2">
          {fields.map((child, childIndex) => (
            <div
              key={child.id}
              className="grid gap-2 sm:grid-cols-[1fr_140px_120px_40px] items-end"
            >
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Продукт</Label>
                <Controller
                  control={control}
                  name={`sections.${sectionIndex}.items.${itemIndex}.children.${childIndex}.productId`}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите продукт" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.baseUnit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Требуется</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="0"
                  {...register(
                    `sections.${sectionIndex}.items.${itemIndex}.children.${childIndex}.qty`,
                    { valueAsNumber: true }
                  )}
                />
              </div>

              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Ед.</Label>
                <Controller
                  control={control}
                  name={`sections.${sectionIndex}.items.${itemIndex}.children.${childIndex}.unit`}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || "г"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ед." />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(childIndex)}
                  title="Удалить"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ productId: "", qty: 0, unit: "г" })}
          >
            + Добавить компонент
          </Button>
        </div>
      </div>
    </div>
  );
}
