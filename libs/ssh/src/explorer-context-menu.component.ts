import {
  Component,
  ElementRef,
  HostListener,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

export type ExplorerMenuItem = {
  id: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

@Component({
  selector: "termsh-explorer-context-menu",
  standalone: true,
  imports: [TranslateModule],
  styles: [`:host { display: contents }`],
  template: `
    <button
      type="button"
      class="fe-ctx__backdrop"
      [attr.aria-label]="'common.actions.close' | translate"
      (click)="close.emit()"
    ></button>
    <div
      #panel
      class="fe-ctx"
      role="menu"
      [style.left.px]="x()"
      [style.top.px]="y()"
      (contextmenu)="$event.preventDefault()"
    >
      @for (item of items(); track item.id) {
        <button
          type="button"
          role="menuitem"
          class="fe-ctx__item"
          [disabled]="item.disabled"
          (click)="onItemClick(item)"
        >
          {{ item.label }}
        </button>
      }
    </div>
  `,
})
export class ExplorerContextMenuComponent {
  readonly x = input.required<number>();
  readonly y = input.required<number>();
  readonly items = input.required<ExplorerMenuItem[]>();
  readonly close = output<void>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly panel = viewChild<ElementRef<HTMLDivElement>>("panel");

  constructor() {
    afterNextRender(() => this.clampPosition());
  }

  @HostListener("document:keydown", ["$event"])
  onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") this.close.emit();
  }

  @HostListener("document:mousedown", ["$event"])
  onPointerDown(event: MouseEvent) {
    if (this.host.nativeElement.contains(event.target as Node)) return;
    this.close.emit();
  }

  @HostListener("document:scroll")
  onScroll() {
    this.close.emit();
  }

  onItemClick(item: ExplorerMenuItem) {
    if (item.disabled) return;
    item.onClick();
    this.close.emit();
  }

  private clampPosition() {
    const panel = this.panel()?.nativeElement;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const pad = 8;
    let left = this.x();
    let top = this.y();
    if (left + rect.width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - rect.width - pad);
    }
    if (top + rect.height > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - rect.height - pad);
    }
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }
}
