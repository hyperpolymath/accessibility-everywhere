# @accessibility-everywhere/react

Production-ready accessible React components following WCAG 2.1 Level AA standards.

## Features

✅ **WCAG 2.1 AA Compliant**
✅ **Keyboard Navigation**
✅ **Screen Reader Support**
✅ **Focus Management**
✅ **TypeScript Support**
✅ **Fully Tested**
✅ **Zero Dependencies** (peer deps only)

## Installation

```bash
npm install @accessibility-everywhere/react
```

## Components

### Button

Accessible button with loading states, icons, and variants.

```tsx
import { Button } from '@accessibility-everywhere/react';

function App() {
  return (
    <Button
      variant="primary"
      size="md"
      onClick={handleClick}
      loading={isLoading}
    >
      Click me
    </Button>
  );
}
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `iconBefore`: ReactNode
- `iconAfter`: ReactNode
- All standard button HTML attributes

**Accessibility Features:**
- Proper ARIA labels
- Loading state announcements
- Focus indicators
- Keyboard support

### Modal

Accessible modal dialog with focus trapping.

```tsx
import { Modal } from '@accessibility-everywhere/react';

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Confirm Action"
    >
      <p>Are you sure you want to proceed?</p>
      <Button onClick={() => setIsOpen(false)}>
        Confirm
      </Button>
    </Modal>
  );
}
```

**Props:**
- `isOpen`: boolean (required)
- `onClose`: () => void (required)
- `title`: string (required)
- `size`: 'sm' | 'md' | 'lg' | 'full'
- `closeOnOverlayClick`: boolean
- `closeOnEscape`: boolean
- `initialFocusRef`: RefObject

**Accessibility Features:**
- Focus trap (keeps focus inside modal)
- Focus restoration (returns to trigger)
- Escape key support
- ARIA dialog role
- Screen reader announcements
- Scroll locking

## Styling

Components come unstyled by default. Add your own CSS or use our default styles:

```tsx
import '@accessibility-everywhere/react/dist/styles.css';
```

### CSS Classes

All components use predictable BEM-style classes:

```css
/* Button */
.a11y-button
.a11y-button--primary
.a11y-button--secondary
.a11y-button--loading

/* Modal */
.a11y-modal-overlay
.a11y-modal
.a11y-modal--md
.a11y-modal__header
.a11y-modal__title
.a11y-modal__content
.a11y-modal__close
```

## Testing

All components are tested with:
- Jest
- React Testing Library
- axe-core (accessibility testing)

## TypeScript

Full TypeScript support with exported types:

```tsx
import { ButtonProps, ModalProps } from '@accessibility-everywhere/react';
```

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## License

MIT
