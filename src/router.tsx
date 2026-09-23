import { createHashHistory, createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

const pages = import.meta.env.VITE_PAGES === "1";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    history: pages && typeof document !== "undefined" ? createHashHistory() : undefined,
  });
}
