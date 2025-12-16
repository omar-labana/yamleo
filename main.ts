import { runMain } from "citty";
import Main from "./src/Main.ts";

if (import.meta.main) {
  const main = new Main();
  runMain(main.cli());
}
