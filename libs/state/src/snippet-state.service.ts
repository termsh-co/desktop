import { Injectable, inject } from "@angular/core";
import type { Snippet } from "@termsh/common";
import type { SaveSnippetPayload } from "@termsh/platform";
import { TermshPlatformService } from "@termsh/platform";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: "root" })
export class SnippetStateService {
  private readonly platform = inject(TermshPlatformService);
  private readonly snippets$ = new BehaviorSubject<Snippet[]>([]);
  private readonly loading$ = new BehaviorSubject(false);
  private readonly error$ = new BehaviorSubject<string | null>(null);

  readonly snippetsStream$ = this.snippets$.asObservable();

  get snippets(): Snippet[] {
    return this.snippets$.value;
  }
  readonly loading$stream = this.loading$.asObservable();
  readonly error$stream = this.error$.asObservable();

  async load() {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      const rows = await this.platform.listSnippets();
      this.snippets$.next(rows);
    } catch (e) {
      this.error$.next(e instanceof Error ? e.message : String(e));
    } finally {
      this.loading$.next(false);
    }
  }

  async save(payload: SaveSnippetPayload) {
    const row = await this.platform.saveSnippet(payload);
    const list = this.snippets$.value;
    const idx = list.findIndex((s) => s.id === row.id);
    if (idx === -1) {
      this.snippets$.next([...list, row]);
    } else {
      const next = [...list];
      next[idx] = row;
      this.snippets$.next(next);
    }
    return row;
  }

  clear() {
    this.snippets$.next([]);
    this.loading$.next(false);
    this.error$.next(null);
  }

  async remove(id: string) {
    await this.platform.deleteSnippet(id);
    this.snippets$.next(this.snippets$.value.filter((s) => s.id !== id));
  }
}
