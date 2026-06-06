import "zone.js";
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";

document.documentElement.classList.add("termsh-native-glass");

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
