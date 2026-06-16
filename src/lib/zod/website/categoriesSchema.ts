import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categoryFormSchema = z.object({
    name: z.string().min(1, "Введите название").max(100),
    slug: z
        .string()
        .min(1, "Введите slug")
        .max(100)
        .regex(slugRegex, "Только латиница, цифры и дефисы"),
});

export const subcategoryFormSchema = z.object({
    categoryId: z.string().uuid(),
    name: z.string().min(1, "Введите название").max(100),
    slug: z
        .string()
        .min(1, "Введите slug")
        .max(100)
        .regex(slugRegex, "Только латиница, цифры и дефисы"),
});