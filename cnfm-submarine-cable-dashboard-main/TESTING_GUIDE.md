# Testing Guidelines for CNFM Project

## Overview
This project uses Vitest for testing React components with comprehensive coverage.

## Test Structure

### Test File Naming
- Component: `ComponentName.tsx`
- Test File: `ComponentName.test.tsx`
- Place test files next to components

### Test Categories

#### 1. Component Rendering Tests
- Test that components render without crashing
- Verify essential elements are present
- Check initial state

#### 2. User Interaction Tests
- Button clicks, form submissions
- Modal opening/closing
- Tab switching
- Input changes

#### 3. API Integration Tests
- Mock fetch requests
- Test error handling
- Test loading states
- Test data display

#### 4. Edge Cases
- Empty data scenarios
- Error conditions
- Network failures

## Established Patterns

### API Mocking
```typescript
// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Setup different responses per endpoint
mockFetch.mockImplementation((url: string) => {
  if (url.includes('/data-summary')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([{ gbps: 1000, percent: 75 }])
    });
  }
  // ... other endpoints
});
```

### Leaflet Mocking
```typescript
// Already set up in src/test/setup.ts
// No additional mocking needed in individual tests
```

### Component Testing
```typescript
test('component functionality', async () => {
  render(<Component />);
  
  // Wait for async operations
  await waitFor(() => {
    expect(screen.getByText('Expected Text')).toBeTruthy();
  });
  
  // Test interactions
  fireEvent.click(screen.getByRole('button', { name: 'Click Me' }));
  
  // Assert results
  expect(/* assertion */).toBeTruthy();
});
```

## Running Tests

### Development
```bash
npm test              # Watch mode for development
npm run test:run      # Single run
```

### CI/CD
```bash
npm run test:coverage # With coverage report
```

## Coverage Goals
- Aim for >80% code coverage
- Focus on critical user flows
- Test error scenarios
- Test edge cases

## Adding New Tests

1. **Follow existing patterns** from DeletedCablesSidebar.test.tsx and HideToolTip.test.tsx
2. **Use descriptive test names** that explain what is being tested
3. **Group related tests** in describe blocks
4. **Mock external dependencies** (APIs, libraries)
5. **Test user behavior**, not implementation details

## Common Mocks Available

- **Leaflet**: Globally mocked in setup.ts
- **ResizeObserver**: Globally mocked in setup.ts
- **window.matchMedia**: Globally mocked in setup.ts

## Test Environment

- **Framework**: Vitest with jsdom
- **Testing Library**: @testing-library/react
- **Assertion Style**: Expect-style assertions
- **Mocking**: Vitest vi functions

## Troubleshooting

### Common Issues
1. **"window is not defined"**: Ensure `@vitest-environment jsdom` is set
2. **Leaflet errors**: Check that Leaflet mocking is properly configured
3. **Async issues**: Use `waitFor()` for async operations
4. **State updates**: Wrap interactions in `act()` if needed

### Debugging
- Use `screen.debug()` to see rendered output
- Use `console.log` in tests for debugging
- Check mock call counts with `mockFn.mock.calls.length`
