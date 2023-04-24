import { PropsWithChildren } from "react";

type LinkProps = {
  href: string;
};

export default function Link(props: PropsWithChildren<LinkProps>) {
  return (
    <a
      {...props}
      {...(props.href?.toString().startsWith("http") && {
        target: "_blank",
        rel: "noopener noreferrer",
      })}
    >
      {props.children}
    </a>
  );
}
