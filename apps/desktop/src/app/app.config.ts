import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom, inject, provideZoneChangeDetection } from "@angular/core";
import { HttpClient, provideHttpClient } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import { TranslateLoader, TranslateModule, TranslateService } from "@ngx-translate/core";
import { TermshTranslateLoader } from "@termsh/angular";
import {
  ActivityTrackerService,
  SettingsStateService,
  SshIdleMonitorService,
  SyncStateService,
  UpdaterStateService,
  VaultStateService,
} from "@termsh/state";
import { TermshPlatformService } from "@termsh/platform";
import { firstValueFrom } from "rxjs";
import { routes } from "./app.routes";

function initAppSettings() {
  return async () => {
    const settings = inject(SettingsStateService);
    const translate = inject(TranslateService);
    const platform = inject(TermshPlatformService);
    const vault = inject(VaultStateService);
    const activity = inject(ActivityTrackerService);
    const sshIdle = inject(SshIdleMonitorService);
    const sync = inject(SyncStateService);
    const updater = inject(UpdaterStateService);

    const snap = settings.snapshot;
    document.documentElement.dataset.theme = snap.themeId;

    vault.bindAutoLockListener();
    activity.start();
    sshIdle.start();
    updater.start();
    await platform.setAutoLockMinutes(snap.vaultAutoLockMinutes);

    if (sync.snapshot.enabled) {
      sync.startAutoSyncTimer();
      if (sync.snapshot.serverUrl.trim() && sync.snapshot.accessToken.trim()) {
        void sync.checkStatus();
      }
    }

    await firstValueFrom(translate.use(snap.locale)).catch((err) => {
      console.error("[termsh] i18n init failed:", err);
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: initAppSettings,
      multi: true,
    },
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: "en",
        loader: {
          provide: TranslateLoader,
          useFactory: (http: HttpClient) => new TermshTranslateLoader(http),
          deps: [HttpClient],
        },
      }),
    ),
  ],
};
