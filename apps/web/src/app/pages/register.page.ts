import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";

@Component({
  selector: "termsh-register-page",
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="auth-panel">
      <header class="auth-panel__header">
        <h1 class="auth-panel__title">Create account</h1>
      </header>
      <div class="auth-panel__body">
        @if (step() === 'providers') {
          <div class="auth-providers">
            <button type="button" class="auth-provider-btn">Continue with Google</button>
            <button type="button" class="auth-provider-btn">Continue with Apple</button>
            <button type="button" class="auth-provider-btn" (click)="step.set('email')">Continue with email</button>
          </div>
        } @else {
          <button type="button" class="auth-back" (click)="step.set('providers')">← Other sign-up options</button>
          <form class="auth-form" (ngSubmit)="onSubmit($event)" novalidate>
            <label class="auth-field">
              <span class="auth-field__label">Email</span>
              <input class="auth-field__input" name="email" type="email" autocomplete="email" placeholder="you@company.com" />
            </label>
            <label class="auth-field">
              <span class="auth-field__label">Password</span>
              <input class="auth-field__input" name="password" type="password" autocomplete="new-password" placeholder="••••••••" />
            </label>
            <button type="submit" class="btn-solid btn-solid--block auth-form__submit">Create account</button>
          </form>
        }
      </div>
      @if (step() === 'providers') {
        <footer class="auth-panel__footer">
          Already have an account?
          <a routerLink="/login" class="auth-link">Sign in</a>
        </footer>
      }
      <div class="auth-panel__legal">
        By continuing you agree to our <a routerLink="/terms" class="auth-link">Terms</a> and
        <a routerLink="/privacy" class="auth-link">Privacy Policy</a>.
      </div>
    </div>
  `,
})
export class RegisterPage {
  readonly step = signal<"providers" | "email">("providers");

  onSubmit(e: Event) {
    e.preventDefault();
  }
}
