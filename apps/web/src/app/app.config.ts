import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { ScrollTopService } from "./scroll-top.service";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: "enabled", scrollPositionRestoration: "enabled" }),
    ),
    provideAppInitializer(() => inject(ScrollTopService).init()),
  ],
};
