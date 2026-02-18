"use client";
import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AddRecipeStepsUI } from "./AddRecipeStepsUI"
import { AddRecipeSectionsUI } from "./AddRecipeSectionsUI";

const MOCK_PRODUCTS = [
  { id: "p1", name: "Яйца", baseUnit: "шт" },
  { id: "p2", name: "Сгущенное молоко", baseUnit: "г" },
  { id: "p3", name: "Масло сливочное", baseUnit: "г" },
  { id: "p4", name: "Мука", baseUnit: "г" },
  { id: "p5", name: "Разрыхлитель", baseUnit: "г" },
  { id: "p6", name: "Сыр Креметте", baseUnit: "г" },
  { id: "p7", name: "Сливки 35%", baseUnit: "г" },
];

export default function AddRecipeForm({ onCreated }) {
  const [open, setOpen] = useState(false);

  const products = useMemo(() => MOCK_PRODUCTS, []);

  const { register, handleSubmit, control, reset, formState } = useForm({
    defaultValues: {
      name: "",
      dishType: "other",
      portionSizeGrams: 0,
      steps: [],
      sections: [
        { title: "Корж — сырьё (ингредиенты до выпечки)", items: [] },
        { title: "Крем — ингредиенты", items: [] },
      ],
    },
  });

  const onSubmit = async (data) => {
    // UI-only: смотри данные в консоли
    console.log("FORM PREVIEW:", data);

    onCreated?.();
    reset();
    setOpen(false);
  };

  return (
    <div className="flex justify-center items-center">
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) reset();
        }}
      >
        <DialogTrigger asChild>
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Добавить ТехКарту
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Добавить техкарту</DialogTitle>
            <DialogDescription>
              Чистый дизайн. Сохранение и расчёты подключим позже.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                placeholder="Например: Торт Наполеон"
                {...register("name")}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="grid gap-2 min-w-[220px]">
                <Label>Тип блюда</Label>
                <Controller
                  control={control}
                  name="dishType"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first">Первые блюда</SelectItem>
                        <SelectItem value="second">Вторые</SelectItem>
                        <SelectItem value="dessert">Десерты</SelectItem>
                        <SelectItem value="other">Другое</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="portionSizeGrams">Размер порции, г</Label>
                <Input
                  id="portionSizeGrams"
                  type="number"
                  min={0}
                  {...register("portionSizeGrams", { valueAsNumber: true })}
                />
              </div>
            </div>

            <AddRecipeSectionsUI control={control} register={register} products={products} />
            <AddRecipeStepsUI control={control} register={register} />

            <div className="pt-2">
              <Button
                type="submit"
                disabled={formState.isSubmitting}
                className="w-full"
              >
                {formState.isSubmitting ? "Создание..." : "Создать (пока без сохранения)"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
