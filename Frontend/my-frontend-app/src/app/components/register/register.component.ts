import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    // Reset form to ensure empty fields
    this.registerForm.reset();
  }

  /**
   * Initialize registration form with validators
   */
  private initializeForm(): void {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phoneNo: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
    });
  }

  /**
   * Handle registration form submission
   */
  onRegister(): void {
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validate form
    if (this.registerForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    this.isLoading = true;

    // Call register service
    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Display success message
        this.successMessage = 'Registration successful! Redirecting to login...';

        // Navigate to login after 1 second
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
        // Handle error
        this.errorMessage =
          error.error?.message || 'Registration failed. Please try again.';
        console.error('Registration error:', error);
      }
    });
  }

  /**
   * Navigate to login page
   */
  onLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Get form controls for template
   */
  get name() {
    return this.registerForm.get('name');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get phoneNo() {
    return this.registerForm.get('phoneNo');
  }
}
