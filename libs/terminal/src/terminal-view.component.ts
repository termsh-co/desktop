import { Component } from "@angular/core";
import { TerminalPaneComponent } from "./terminal-pane.component";

@Component({
  selector: "termsh-terminal-view",
  standalone: true,
  imports: [TerminalPaneComponent],
  template: `
    <div class="view view--terminal">
      <termsh-terminal-pane />
    </div>
  `,
})
export class TerminalViewComponent {}
