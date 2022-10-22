
import type { Item } from "@prisma/client";
import { prisma } from "~/db.server"

export const createItem = (data: Pick<Item, "listId" | "name">) => {
    return prisma.item.create({ data })
}


export const toggleCompleted = (data: Pick<Item, 'id' | 'completed'>) => {
    return prisma.item.update({
        where: { id: data.id },
        data: { completed: !data.completed }
    })
}

export const deleteItem = (id: Item['id']) => {
    return prisma.item.delete({ where: { id } })
}

export const getItem = (id: Item['id']) => {
    return prisma.item.findUnique({where: {id}, include: {List: true}})
}
