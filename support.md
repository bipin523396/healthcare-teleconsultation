# Health Monitoring App - Support

## Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn/pnpm
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone [your-repository-url]
   cd project-2
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   VITE_API_URL=http://localhost:5000
   NODE_ENV=development
   ```

4. Start the development server:
   ```bash
   # Start frontend
   npm run dev
   
   # In a separate terminal, start the backend
   node server.js
   ```

## Common Issues

### 1. Module Not Found Errors
If you see errors like "Module not found: Can't resolve '@components/...'"
```bash
npx shadcn-ui@latest add [component-name]
```

### 2. 500 Internal Server Error
If you encounter a 500 error:
1. Check the server console for error messages
2. Ensure all environment variables are set
3. Verify the database connection (if applicable)

### 3. Styling Issues
If styles aren't loading:
1. Check if Tailwind CSS is properly configured in `tailwind.config.js`
2. Ensure your components are importing the correct CSS modules

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Getting Help

If you need further assistance:

1. **Check the [GitHub Issues](https://github.com/yourusername/project-2/issues) page** to see if your issue has already been reported.

2. **Search the documentation** for similar issues.

3. **Create a new issue** if you can't find a solution:
   - Describe the problem in detail
   - Include steps to reproduce the issue
   - Add any error messages or screenshots
   - Mention your environment (OS, Node.js version, etc.)

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License.
