import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Loading state */
  loading?: boolean;
  /** Icon to display before text */
  iconBefore?: React.ReactNode;
  /** Icon to display after text */
  iconAfter?: React.ReactNode;
}

/**
 * Accessible button component following WCAG 2.1 AA standards
 *
 * Features:
 * - Proper focus management
 * - Keyboard navigation
 * - Screen reader support
 * - Loading states with ARIA
 * - Disabled state handling
 *
 * @example
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      iconBefore,
      iconAfter,
      children,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'a11y-button';
    const variantClasses = `a11y-button--${variant}`;
    const sizeClasses = `a11y-button--${size}`;
    const loadingClasses = loading ? 'a11y-button--loading' : '';
    const classes = `${baseClasses} ${variantClasses} ${sizeClasses} ${loadingClasses} ${className}`.trim();

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <span className="a11y-button__spinner" aria-hidden="true" />
        )}
        {!loading && iconBefore && (
          <span className="a11y-button__icon-before" aria-hidden="true">
            {iconBefore}
          </span>
        )}
        <span className="a11y-button__text">{children}</span>
        {!loading && iconAfter && (
          <span className="a11y-button__icon-after" aria-hidden="true">
            {iconAfter}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
