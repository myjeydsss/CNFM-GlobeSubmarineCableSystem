# Testing Workflow Example

## When Adding a New Component

### 1. Create Component File
```tsx
// src/components/NewComponent.tsx
export const NewComponent = () => {
  return <div>New Feature</div>;
};
```

### 2. Create Test File Immediately
```tsx
// src/components/NewComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { NewComponent } from './NewComponent';

test('renders new component', () => {
  render(<NewComponent />);
  expect(screen.getByText('New Feature')).toBeTruthy();
});
```

### 3. Run Tests to Ensure Setup Works
```bash
npm test
```

### 4. Add Functionality with Tests
- Write test for new behavior
- Implement the behavior
- Ensure test passes
- Refactor if needed

## When Modifying Existing Code

### 1. Run Existing Tests First
```bash
npm run test:run
```

### 2. Make Changes
- Modify your component code
- Update tests if behavior changes
- Add new tests for new functionality

### 3. Verify All Tests Pass
```bash
npm test
```

## Deployment Checklist

### Before Deployment
- [ ] All tests pass (`npm run test:run`)
- [ ] Coverage is adequate (`npm run test:coverage`)
- [ ] No console errors in tests
- [ ] Manual testing of new features

### CI/CD Pipeline
Your GitHub Actions will automatically:
- Run tests on every push
- Block deployment if tests fail
- Provide test results in PR reviews
