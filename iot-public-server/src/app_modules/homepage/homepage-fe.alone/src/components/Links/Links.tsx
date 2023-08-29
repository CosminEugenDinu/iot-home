import { ReactNode } from "react";

export function Links(props: { children: ReactNode }) {
  const paths = {
    "/cmd/": "Command Line Interface",
  };

  return (
    <>
      <h2>{props.children}</h2>
      {Array.from(Object.entries(paths)).map(([path, name], i) => (
        <div key={i}>
          <a href={path}>{name}</a>
        </div>
      ))}
    </>
  );
}
