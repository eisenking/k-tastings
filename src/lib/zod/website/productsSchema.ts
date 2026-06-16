import { z } from "zod";

export const productFormSchema = z.object({
    name: z.string().min(1, "Название обязательно").max(255),
    url: z.string().min(1, "URL обязателен").max(255),
    type: z.string().max(100).optional().or(z.literal("")),
    description: z.string().optional().or(z.literal("")),
    moreInfo: z.string().optional().or(z.literal("")),

    imgUrl: z.string().max(500).optional().or(z.literal("")),
    imgAlt: z.string().max(500).optional().or(z.literal("")),

    price: z.coerce.number().nonnegative().optional().nullable(),
    decorType: z.string().max(255).optional().or(z.literal("")),
    decorPrice: z.coerce.number().nonnegative().optional().nullable(),

    tiers: z.coerce.number().int().nonnegative().optional().nullable(),
    weightOnPhoto: z.coerce.number().nonnegative().optional().nullable(),
    mainCover: z.string().max(255).optional().or(z.literal("")),

    mainCategory: z.string().max(255).optional().or(z.literal("")),
    isNewProduct: z.boolean().default(false),
    sortOrder: z.coerce.number().int().default(0),

    categoryIds: z.array(z.string().uuid()).default([]),
    subcategoryIds: z.array(z.string().uuid()).default([]),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;