import type { ActionFunction, LoaderArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import invariant from "tiny-invariant";
import { getListById } from "~/models/list.server";

import { json } from "@remix-run/server-runtime";

import { FaCheck, FaTimes, FaTrash } from 'react-icons/fa'

import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import { requireUser } from "~/session.server";
import type { Item, List, User } from "@prisma/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createItem, toggleCompleted, deleteItem, getItem } from "~/models/item.server";
import Card from "~/components/Card";

type ActionData =
  {
    errors: Record<string, null | string>
  }
  | undefined;

export const AddItemAction = async (formData: FormData) => {
  const name = formData.get('name')
  const listId = formData.get('listId')

  const errors = {
    name: name ? null : "Name is required",
    listId: listId ? null : "listId is required",
  };

  const hasErrors = Object.values(errors).some(
    (errorMessage) => errorMessage
  );

  if (hasErrors) {
    return json<ActionData>({ errors });
  }

  invariant(typeof name === 'string', 'Name isn\'t a string')
  invariant(typeof listId === 'string', 'listId isn\'t a string')

  await createItem({ name, listId })

  return json({ ok: true });
}

const ToggleCompletedAction = async (formData: FormData, user: User) => {
  const itemId = formData.get('itemId')
  const completed = formData.get('completed') === 'true'

  const errors = {
    itemId: itemId ? null : "itemId is required",
  };

  const hasErrors = Object.values(errors).some(
    (errorMessage) => errorMessage
  );

  if (hasErrors) {
    return json<ActionData>({ errors });
  }

  invariant(typeof itemId === 'string', 'Name isn\'t a string')
  invariant(typeof completed === 'boolean', 'completed isn\'t a boolean')

  const item = await getItem(itemId);
  invariant(item?.List.userId === user.id, "Not found")

  await toggleCompleted({ id: itemId, completed })

  return json({ ok: true })
}

export const deleteItemAction = async (formData: FormData, user: User) => {
  const itemId = formData.get('itemId')
  const errors = {
    itemId: itemId ? null : "itemId is required",
  };

  const hasErrors = Object.values(errors).some(
    (errorMessage) => errorMessage
  );

  if (hasErrors) {
    return json<ActionData>({ errors });
  }

  invariant(typeof itemId === 'string', 'Name isn\'t a string')

  const item = await getItem(itemId);
  invariant(item?.List.userId === user.id, "Not found")

  await deleteItem(itemId)

  return json({ ok: true })
}

export const action: ActionFunction = async ({ request }) => {
  const [user, formData] = await Promise.all([
    requireUser(request),
    request.formData()
  ])

  switch (formData.get('action')) {
    case "addItem":
      return AddItemAction(formData)
    case "toggleComplete":
      return ToggleCompletedAction(formData, user);
    case "deleteItem":
      return deleteItemAction(formData, user)
    default:
      return json({ message: 'unsupported action' })
  }
}

export const loader = async ({ request, params }: LoaderArgs) => {
  invariant(params.listId);
  const [user, list] = await Promise.all([
    requireUser(request),
    getListById(params.listId)
  ])

  invariant(list, "List not found");
  if (user.id !== list.userId) return redirect("/lists");

  return json({ list });
};

export default function Show() {
  const { list } = useLoaderData<typeof loader>();
  if (!list) return <></>

  const todoItems = list.item.filter(({ completed }) => !completed) as unknown as Item[]
  const doneItems = list.item.filter(({ completed }) => completed) as unknown as Item[]

  return (
    <>
      <div className="flex justify-between items-center my-4">
        <div>
          <span className="text-xs text-gray-300 uppercase">Done {doneItems.length ?? 0}/{list.item.length}</span>
          <h2 className="text-3xl capitalize mt-1">
            {list.name}
          </h2>
        </div>

        <AddItem listId={list.id} />
      </div>
      <hr className="opacity-10 mb-4" />


      <div className="grid grid-cols-2 gap-8 mt-8" >
        <div>

          <Card>
            <h3 className="text-xl text-center mb-4">Items in need of doing</h3>
            <ol className="list-disc mt-2 text-lg">
              {todoItems.length > 0 ?
                (todoItems.map((item) => (
                  <TodoItem key={item.id} item={item} />
                )))
                : <h5 className="text-base text-gray-500">You don't have any items that need doing</h5>
              }
            </ol>
          </Card>
        </div>
        <div>

          <Card>
            <h3 className="text-xl text-center mb-4">Items already done doing</h3>

            <ol className="list-disc mt-2 text-lg">
              {doneItems.length > 0 ?
                (doneItems.map((item) => (
                  <TodoItem key={item.id} item={item} />
                )))
                : <h5 className="text-base text-gray-500">You haven't done anything, get doing.</h5>
              }
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}

export const TodoItem = (props: { item: Item }) => {
  const { item } = props

  const [isHovering, setIsHovering] = useState(false);

  const handleMouseOver = () => {
    setIsHovering(true);
  };

  const handleMouseOut = () => {
    setIsHovering(false);
  };

  return (
    <div className="flex space-x-4 items-center hover:bg-gray-800 rounded-md px-4 py-1" onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
      <Form method="delete" className="flex items-center">
        <input type="hidden" name="action" value="deleteItem" />
        <input type="hidden" name="itemId" value={item.id} />
        <button><FaTrash className="text-red-800" /></button>
      </Form>
      <Form method="post" className="w-full">
        <input type="hidden" name="action" value="toggleComplete" />
        <input type="hidden" name="completed" value={String(item.completed)} />
        <input type="hidden" name="itemId" value={item.id} />
        <button className="flex items-center justify-between w-full space-x-2">
          <h5>
            {item.name}
          </h5>
          {isHovering && <>{item.completed ? <FaTimes className="text-red-800" /> : <FaCheck className="text-green-800" />}</>}
        </button>
      </Form>
    </div>
  )
}

const AddItem = (props: { listId: List['id'] }) => {
  const { listId } = props;
  const newItem = useFetcher()
  const ref = useRef()

  useEffect(() => {
    if (newItem.type === "done" && newItem.data.ok) {
      ref.current.reset();
    }
  }, [newItem]);

  const errors = useMemo(() => newItem.data?.errors ?? null, [newItem.data])

  return (
    <newItem.Form ref={ref} method="post" className="flex justify-center items-center space-x-4" >
      <input type="hidden" name="listId" value={listId} />{" "}
      <input type="hidden" name="action" value="addItem" />{" "}

      <div>
        <div>
          {
            errors?.name ? <span className="text-red-800 ml-2">{errors?.name}</span> : ""
          }
        </div>
        <input type="text" name="name"
          disabled={newItem.state === "submitting"}
          className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Add Todo" required />
      </div>
      <button
        type="submit"
        className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
        disabled={newItem.state === "submitting"}
      >
        {newItem.state === 'submitting'
          ? "Adding item..."
          : "Add item"
        }
      </button>
    </newItem.Form>
  )
}
