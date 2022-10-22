import type { User } from "@prisma/client";
import { Link, Form } from "@remix-run/react";

import { useOptionalUser } from "~/utils";

export default function Index() {
  const user = useOptionalUser();

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-4/12 rounded-lg bg-zinc-900 p-8 text-center">
        {user ? <AuthenticatedContent user={user} /> : <GuestContent />}
      </div>
    </div>
  );
}

const AuthenticatedContent = (props: { user: User }) => {
  const { user } = props;

  return (
    <>
      <h2 className="center">Hello {user.email}</h2>
      <div className="mt-4 flex justify-between">
        <Link
          to="lists"
          className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
        >
          View your lists
        </Link>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
          >
            Logout
          </button>
        </Form>{" "}
      </div>
    </>
  );
};

const GuestContent = () => {
  return (
    <>
      <div className="flex justify-center items-center space-x-2">
        <Link to={"/join"}
          className="text-blue-500 underline"
        >
          Sign up now
        </Link>
        <span>
          or
        </span>
        <Link to={"/join"}
          className="text-blue-500 underline"
        >
          Login
        </Link>
      </div>
    </>
  );
};
