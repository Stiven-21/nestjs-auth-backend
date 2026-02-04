import { PasswordPolicyConstraint } from 'src/common/validator/passwordPolicyConstraint.validator';
import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsValidPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: PasswordPolicyConstraint,
    });
  };
}
