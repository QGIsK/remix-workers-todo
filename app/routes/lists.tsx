import type { List, User } from "@prisma/client";
import { Outlet, useLoaderData, Link, Form, useFetcher } from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { useEffect, useMemo, useRef } from "react";
import { FaTrash } from "react-icons/fa";
import invariant from "tiny-invariant";
import { getUserLists, deleteList, createList, getListById } from "~/models/list.server";
import { requireUser } from "~/session.server";


type ActionData =
  {
    errors: Record<string, null | string>
  }
  | undefined;

const deleteAction = async (formData: FormData, user: User) => {
  const listId = formData.get('listId')

  const errors = {
    listId: listId ? null : "listId is required",
  };

  const hasErrors = Object.values(errors).some(
    (errorMessage) => errorMessage
  );

  if (hasErrors) {
    return json<ActionData>({ errors });
  }

  invariant(typeof listId === 'string', 'listId isn\'t a string')

  const list = await getListById(listId)
  invariant(list?.userId === user.id, "Not found")

  await deleteList(listId)

  return redirect('/lists')
}

const createAction = async (formData: FormData) => {
  const name = formData.get('name')
  const userId = formData.get('userId')

  const errors = {
    name: userId ? null : "name is required",
    userId: userId ? null : "userId is required",
  };

  const hasErrors = Object.values(errors).some(
    (errorMessage) => errorMessage
  );

  if (hasErrors) {
    return json<ActionData>({ errors });
  }

  invariant(typeof name === 'string', 'name isn\'t a string')
  invariant(typeof userId === 'string', 'userId isn\'t a string')

  await createList({ name, userId })

  return json({ ok: true })
}

export const action: ActionFunction = async ({ request }) => {
  const [user, formData] = await Promise.all([
    requireUser(request),
    request.formData()
  ])

  switch (formData.get("action")) {
    case "create":
      return createAction(formData)
    case "delete":
      return deleteAction(formData, user)
    default:
      return json({ message: "Unsupported action" })
  }
}

type LoaderData = {
  lists: List[];
  user: User;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);

  return json<LoaderData>({
    user,
    lists: await getUserLists(user.id),
  });
};

const sidebarStyle = {
  minWidth: "320px",
};

export default function Lists() {
  const { user, lists } = useLoaderData<typeof loader>();

  return (
    <>
      <div className="relative flex">
        <div style={sidebarStyle}>
          <Sidebar user={user} lists={lists} />
        </div>
        <div className="h-full w-full px-12 py-8">
          <Outlet />
        </div>
      </div>
    </>
  );
}

const Sidebar = (props: { user: User; lists: List[] }) => {
  const { user, lists } = props;

  return (
    <div className="fixed left-0 h-screen bg-zinc-900" style={sidebarStyle}>
      <h2 className=" border-b-zinc-900 text-lg mt-8 mb-4 px-12">Hello {user.email}</h2>

      <hr className="opacity-10 mb-8" />
      <div className="px-12 py-y">

        <ol className="mt-2 list-disc space-y-2">
          {lists.map((list) => (
            <li key={list.id}>
              <span className="flex justify-between">
                <Link to={list.id} className="w-8/12" >
                  {list.name}
                </Link>
                <Form method="post">
                  <input type="hidden" name="action" value="delete" />
                  <input type="hidden" name="listId" value={list.id} />
                  <button><FaTrash className="text-red-800 cursor-pointer" /></button>
                </Form>
              </span>
            </li>
          ))}
        </ol>

        <AddList user={user} />

        <hr className="opacity-10 mt-8 mb-4" />

        <Form method="post" action="/logout" className="flex justify-center">
          <button className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600 w-4/6">
            Logout
          </button>
        </Form>

      </div>
    </div>
  );
};

const AddList = (props: { user: User }) => {
  const { user } = props;
  const newList = useFetcher()
  const ref = useRef()

  useEffect(() => {
    if (newList.type === "done" && newList.data.ok) {
      ref.current.reset();
    }
  }, [newList]);

  return (
    <newList.Form ref={ref} method="post" className="flex justify-center items-center space-x-4 mt-8" >
      <input type="hidden" name="userId" value={user.id} />{" "}
      <input type="hidden" name="action" value="create" />{" "}

      <input type="text" name="name"
        disabled={newList.state === "submitting"}
        className="border text-sm rounded-lg block w-full p-2 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="New list" required />
    </newList.Form>
  )
}
