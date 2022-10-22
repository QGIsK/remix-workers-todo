export default function Card(props: { children: JSX.Element }): JSX.Element;
export default function Card(props: { children: JSX.Element[] }): JSX.Element[];
export default function Card(props: {children: JSX.Element[] | JSX.Element}): JSX.Element | JSX.Element[] {
    return <>
        <div className="bg-zinc-900 px-6 py-4 rounded-md">{props.children}</div>
    </>
}
