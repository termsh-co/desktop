import { Injectable, inject } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import type { Host, SaveHostPayload } from "@termsh/common";
import { TermshPlatformService } from "@termsh/platform";

/** RxJS replacement for desktop-legacy hostStore (Faz 1C). */
@Injectable({ providedIn: "root" })
export class HostStateService {
  private readonly platform = inject(TermshPlatformService);
  private readonly hosts$ = new BehaviorSubject<Host[]>([]);
  private readonly loading$ = new BehaviorSubject(false);
  private readonly error$ = new BehaviorSubject<string | null>(null);

  readonly hostsStream$ = this.hosts$.asObservable();
  readonly loading$stream = this.loading$.asObservable();
  readonly error$stream = this.error$.asObservable();

  get hosts(): Host[] {
    return this.hosts$.value;
  }

  async load() {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      const hosts = await this.platform.listHosts();
      this.hosts$.next(hosts);
    } catch (e) {
      this.error$.next(e instanceof Error ? e.message : String(e));
    } finally {
      this.loading$.next(false);
    }
  }

  async save(payload: SaveHostPayload): Promise<Host> {
    const host = await this.platform.saveHost(payload);
    const exists = this.hosts.some((h) => h.id === host.id);
    this.hosts$.next(
      exists ? this.hosts.map((h) => (h.id === host.id ? host : h)) : [...this.hosts, host],
    );
    return host;
  }

  async remove(id: string) {
    await this.platform.deleteHost(id);
    this.hosts$.next(this.hosts.filter((h) => h.id !== id));
  }

  /** Başarılı SSH sonrası uzak sunucudan OS tespit eder ve listeyi günceller. */
  async detectPlatformAfterConnect(hostId: string, passwordOverride?: string) {
    try {
      const updated = await this.platform.detectHostPlatform(hostId, passwordOverride);
      this.hosts$.next(this.hosts.map((h) => (h.id === hostId ? updated : h)));
    } catch {
      // Tespit başarısız olsa da oturum devam eder
    }
  }

  clear() {
    this.hosts$.next([]);
    this.loading$.next(false);
    this.error$.next(null);
  }
}
