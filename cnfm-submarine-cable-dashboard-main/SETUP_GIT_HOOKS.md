# Husky Git Hooks (recommended)
# Run this to set up pre-commit hooks:

# Install husky (one time setup)
npm install -D husky

# Enable git hooks
npx husky init

# Add pre-commit hook that runs tests
echo "npm run test:run && npm run lint" > .husky/pre-commit

# Add pre-push hook that runs tests with coverage
echo "npm run test:coverage" > .husky/pre-push
