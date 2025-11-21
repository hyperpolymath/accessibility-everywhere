# accessibility-everywhere

## Project Overview

This project is dedicated to promoting and implementing accessibility best practices across web and software development. The goal is to make digital experiences accessible to everyone, including people with disabilities.

## Purpose

- Provide tools, utilities, and resources for implementing accessibility features
- Demonstrate best practices for WCAG 2.1/2.2 compliance
- Educate developers on creating inclusive digital experiences
- Offer reusable components and patterns that prioritize accessibility

## Key Principles

### Accessibility Standards
- Follow WCAG 2.1 Level AA guidelines (minimum)
- Aim for WCAG 2.2 compliance where possible
- Support ARIA (Accessible Rich Internet Applications) best practices
- Ensure keyboard navigation for all interactive elements
- Provide screen reader compatibility

### Development Guidelines
- **Semantic HTML**: Use proper HTML5 semantic elements
- **ARIA Labels**: Add appropriate ARIA attributes when needed
- **Color Contrast**: Maintain minimum 4.5:1 contrast ratio for normal text
- **Focus Management**: Ensure visible focus indicators and logical focus order
- **Alt Text**: Provide meaningful alternative text for images
- **Responsive Design**: Support different viewport sizes and zoom levels
- **Error Handling**: Provide clear, accessible error messages

### Testing Requirements
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Verify keyboard-only navigation
- Check color contrast ratios
- Validate with automated tools (axe, Lighthouse, WAVE)
- Manual testing with assistive technologies

## Code Conventions

### HTML/JSX
- Always include `lang` attribute on html element
- Use semantic elements (`<nav>`, `<main>`, `<header>`, `<footer>`, etc.)
- Include skip navigation links
- Ensure form labels are properly associated

### CSS
- Avoid `outline: none` without providing alternative focus styles
- Use relative units (rem, em) for better zoom support
- Ensure sufficient color contrast
- Support prefers-reduced-motion media query

### JavaScript/TypeScript
- Manage focus appropriately in dynamic content
- Announce dynamic updates to screen readers using ARIA live regions
- Ensure custom components are keyboard accessible
- Avoid keyboard traps

## Common Patterns

### Accessible Button
```jsx
<button
  type="button"
  aria-label="Close dialog"
  onClick={handleClose}
>
  <span aria-hidden="true">&times;</span>
</button>
```

### Skip Link
```jsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

### Accessible Form Field
```jsx
<div>
  <label htmlFor="email">Email Address</label>
  <input
    type="email"
    id="email"
    name="email"
    aria-required="true"
    aria-describedby="email-error"
  />
  <span id="email-error" role="alert">
    {errorMessage}
  </span>
</div>
```

## Tools & Resources

### Recommended Tools
- **axe DevTools**: Browser extension for accessibility testing
- **Lighthouse**: Built into Chrome DevTools
- **WAVE**: Web accessibility evaluation tool
- **Screen Readers**: NVDA (Windows), JAWS (Windows), VoiceOver (macOS/iOS)
- **Color Contrast Analyzers**: WebAIM contrast checker, Colour Contrast Analyser

### Documentation References
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Resources](https://webaim.org/)

## Claude Code Instructions

When working on this project:

1. **Always prioritize accessibility** in every feature and component
2. **Include ARIA attributes** when semantic HTML alone is insufficient
3. **Test keyboard navigation** for all interactive elements
4. **Verify color contrast** meets WCAG AA standards minimum
5. **Add meaningful alt text** for all images and icons
6. **Document accessibility features** in code comments when implementing complex patterns
7. **Consider screen reader users** when implementing dynamic content
8. **Avoid common anti-patterns** like div/span buttons without proper ARIA
9. **Suggest accessibility improvements** when reviewing existing code
10. **Run accessibility audits** using automated tools before completing features

## Project Structure

```
accessibility-everywhere/
├── src/              # Source code
├── components/       # Reusable accessible components
├── utils/           # Accessibility utility functions
├── examples/        # Example implementations
├── docs/            # Documentation and guides
└── tests/           # Accessibility tests
```

## Contributing

When contributing to this project:
- All pull requests must pass accessibility audits
- Include accessibility considerations in code reviews
- Document any accessibility trade-offs or limitations
- Test with at least one screen reader before submitting
- Follow the accessibility guidelines outlined above

## Notes for Claude

- When suggesting code changes, always include accessibility attributes
- If an implementation might have accessibility concerns, call them out
- Prefer semantic HTML over div-based layouts
- When in doubt about accessibility, err on the side of over-explaining/over-implementing
- This project serves as an educational resource, so clarity and best practices are paramount
