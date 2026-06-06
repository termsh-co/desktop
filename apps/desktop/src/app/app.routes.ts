import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("@termsh/vault").then((m) => m.VaultGateComponent),
  },
];
