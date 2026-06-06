import { HttpClient } from "@angular/common/http";
import { TranslateLoader } from "@ngx-translate/core";
import { forkJoin, map, type Observable } from "rxjs";

const NS = [
  "common",
  "vault",
  "hosts",
  "session",
  "settings",
  "terminal",
  "palette",
  "errors",
  "remote",
  "keys",
  "snippets",
  "updater",
] as const;

/** Merges legacy namespace JSON files into one translate tree per locale. */
export class TermshTranslateLoader implements TranslateLoader {
  constructor(private readonly http: HttpClient) {}

  getTranslation(lang: string): Observable<Record<string, unknown>> {
    const requests = NS.map((ns) =>
      this.http
        .get<Record<string, unknown>>(`/assets/i18n/${lang}/${ns}.json`)
        .pipe(map((data) => ({ [ns]: data }))),
    );
    return forkJoin(requests).pipe(
      map((parts) =>
        Object.assign(
          { shell: { migrationHint: "Desktop UI migration in progress." } },
          ...parts,
        ),
      ),
    );
  }
}
