

import type { List } from "@prisma/client";

import { prisma } from "~/db.server"

export type { List }

export const getListById = async (id: List['id']) => {
  return prisma.list.findUnique({ where: { id }, include: { item: true } })
}

export const getUserLists = async (userId: List['userId']) => {
  return prisma.list.findMany({ where: { userId } })
}

export const deleteList = async (id: List['id']) => {
  return prisma.list.delete({where: {id}})
}

export const createList = async(data: Pick<List, "name" | "userId">) => {
  return prisma.list.create({data})
}
