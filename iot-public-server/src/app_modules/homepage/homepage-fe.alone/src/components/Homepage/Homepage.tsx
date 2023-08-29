import css from "./Homepage.css";
import { Servers } from "../Servers/Servers";
import { Links } from "../Links/Links";

export function Homepage() {
  return (
    <>
      <div className={css.bg}>
        <h1>Home IoT!</h1>
        <Links>Links:</Links>
        <Servers />
      </div>
    </>
  );
}
