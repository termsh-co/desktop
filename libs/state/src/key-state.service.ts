import { Injectable, inject } from "@angular/core";
import type { SshKey } from "@termsh/common";
import type { GenerateKeyPayload, GenerateKeyResult, SaveKeyPayload } from "@termsh/platform";
import { TermshPlatformService } from "@termsh/platform";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: "root" })
export class KeyStateService {
  private readonly platform = inject(TermshPlatformService);
  private readonly keys$ = new BehaviorSubject<SshKey[]>([]);
  private readonly loading$ = new BehaviorSubject(false);
  private readonly error$ = new BehaviorSubject<string | null>(null);

  readonly keysStream$ = this.keys$.asObservable();
  readonly loading$stream = this.loading$.asObservable();
  readonly error$stream = this.error$.asObservable();

  get keys(): SshKey[] {
    return this.keys$.value;
  }

  async load() {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      const rows = await this.platform.listKeys();
      this.keys$.next(rows);
    } catch (e) {
      this.error$.next(e instanceof Error ? e.message : String(e));
    } finally {
      this.loading$.next(false);
    }
  }

  async save(payload: SaveKeyPayload) {
    const row = await this.platform.saveKey(payload);
    const list = this.keys$.value;
    const idx = list.findIndex((k) => k.id === row.id);
    if (idx === -1) {
      this.keys$.next([...list, row]);
    } else {
      const next = [...list];
      next[idx] = row;
      this.keys$.next(next);
    }
    return row;
  }

  async generate(payload: GenerateKeyPayload): Promise<GenerateKeyResult> {
    const result = await this.platform.generateKey(payload);
    const list = this.keys$.value;
    const idx = list.findIndex((k) => k.id === result.key.id);
    if (idx === -1) {
      this.keys$.next([...list, result.key]);
    } else {
      const next = [...list];
      next[idx] = result.key;
      this.keys$.next(next);
    }
    return result;
  }

  async remove(id: string) {
    await this.platform.deleteKey(id);
    this.keys$.next(this.keys$.value.filter((k) => k.id !== id));
  }

  clear() {
    this.keys$.next([]);
    this.loading$.next(false);
    this.error$.next(null);
  }
}
