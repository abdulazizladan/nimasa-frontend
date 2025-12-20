import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthStore } from '../../../../auth/store/auth.store';

@Component({
    selector: 'app-settings',
    standalone: false,
    templateUrl: './settings.html',
    styleUrl: './settings.scss'
})
export class Settings implements OnInit {

    public authStore = inject(AuthStore);
    private fb = inject(FormBuilder);

    changePasswordForm!: FormGroup;
    profileForm!: FormGroup;
    isDarkTheme = false;

    ngOnInit() {
        this.initializeForms();
        this.loadThemePreference();
    }

    initializeForms() {
        this.changePasswordForm = this.fb.group({
            currentPassword: ['', [Validators.required, Validators.minLength(6)]],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });

        this.profileForm = this.fb.group({
            email: [{ value: this.authStore.userEmail(), disabled: true }],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            phone: ['']
        });
    }

    passwordMatchValidator(group: FormGroup) {
        const newPassword = group.get('newPassword')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        return newPassword === confirmPassword ? null : { passwordMismatch: true };
    }

    onChangePassword() {
        if (this.changePasswordForm.valid) {
            const { currentPassword, newPassword } = this.changePasswordForm.value;
            // TODO: Implement password change logic with backend service
            console.log('Change password:', { currentPassword, newPassword });
            this.changePasswordForm.reset();
        }
    }

    onUpdateProfile() {
        if (this.profileForm.valid) {
            const profileData = this.profileForm.getRawValue();
            // TODO: Implement profile update logic with backend service
            console.log('Update profile:', profileData);
        }
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        this.applyTheme();
        this.saveThemePreference();
    }

    private applyTheme() {
        const body = document.body;
        if (this.isDarkTheme) {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }
    }

    private loadThemePreference() {
        const savedTheme = localStorage.getItem('theme');
        this.isDarkTheme = savedTheme === 'dark';
        this.applyTheme();
    }

    private saveThemePreference() {
        localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
    }
}
