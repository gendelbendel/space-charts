import { PropsWithChildren } from "react";

type FAQItemProps = {
  title: string;
};

export default function FAQItem(props: PropsWithChildren<FAQItemProps>) {
  return (
    <div className="faq-item">
      <h2>{props.title}</h2>
      {props.children}
    </div>
  );
}
