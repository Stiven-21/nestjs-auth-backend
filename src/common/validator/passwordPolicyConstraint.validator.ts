import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PasswordPolicyService } from 'src/modules/auth/password-policy/password-policy.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class PasswordPolicyConstraint implements ValidatorConstraintInterface {
  constructor(
    private readonly authPaswordPolicyService: PasswordPolicyService,
  ) {}

  async validate(password: string) {
    const policy = await this.authPaswordPolicyService.findOne();

    if (!policy) return true;

    // Validar longitud mínima
    if (password.length < policy.minLength) return false;

    // Validar longitud máxima
    if (password.length > policy.maxLength) return false;

    // Validar mayúsculas
    if (policy.requireUppercase && !/[A-Z]/.test(password)) return false;

    // Validar minúsculas
    if (policy.requireLowercase && !/[a-z]/.test(password)) return false;

    // Validar números
    if (policy.requireNumbers && !/\d/.test(password)) return false;

    // Validar caracteres especiales
    if (
      policy.requireSpecial &&
      !/[.,!@#$%^&*()_+\-=[\]{};':"\\|<>/?]/.test(password)
    )
      return false;

    return true;
  }

  defaultMessage() {
    return 'Password does not meet security requirements';
  }
}
