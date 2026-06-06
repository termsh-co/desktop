import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";

@Component({
  selector: "termsh-login-page",
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="auth-panel">
      <header class="auth-panel__header">
        <h1 class="auth-panel__title">Sign in</h1>
      </header>
      <div class="auth-panel__body">
        @if (step() === 'providers') {
          <div class="auth-providers">
            <button type="button" class="auth-provider-btn">Continue with Google</button>
            <button type="button" class="auth-provider-btn">Continue with Apple</button>
            <button type="button" class="auth-provider-btn">Continue with SAML SSO</button>
            <button type="button" class="auth-provider-btn" (click)="step.set('email')">Continue with email</button>
          </div>
        } @else {
          <button type="button" class="auth-back" (click)="step.set('providers')">← Other sign-in options</button>
          <form class="auth-form" (ngSubmit)="onSubmit($event)" novalidate>
            <label class="auth-field">
              <span class="auth-field__label">Email</span>
              <input class="auth-field__input" name="email" type="email" autocomplete="email" placeholder="you@company.com" />
            </label>
            <label class="auth-field">
              <span class="auth-field__label">Password</span>
              <input class="auth-field__input" name="password" type="password" autocomplete="current-password" placeholder="••••••••" />
            </label>
            <div class="auth-form__row">
              <label class="auth-check">
                <input type="checkbox" name="remember" class="auth-check__input" />
                <span class="auth-check__box" aria-hidden></span>
                <span class="auth-check__label">Remember me</span>
              </label>
              <a href="#" class="auth-link auth-link--muted" (click)="$event.preventDefault()">Forgot password?</a>
            </div>
            <button type="submit" class="btn-solid btn-solid--block auth-form__submit">Sign in</button>
          </form>
        }
      </div>
      @if (step() === 'providers') {
        <footer class="auth-panel__footer">
          Don't have an account?
          <a routerLink="/register" class="auth-link">Sign up</a>
        </footer>
      }
    </div>
  `,
})
export class LoginPage {
  readonly step = signal<"providers" | "email">("providers");

  onSubmit(e: Event) {
    e.preventDefault();
  }
}
