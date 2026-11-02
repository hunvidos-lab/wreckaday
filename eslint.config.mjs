import tseslint from 'typescript-eslint';
export default tseslint.config({ignores:['**/node_modules/**','**/dist/**','.venv/**']}, ...tseslint.configs.recommended, {files:['apps/mobile/src/ui.tsx'],rules:{'@typescript-eslint/no-require-imports':'off'}}, {rules:{'@typescript-eslint/no-explicit-any':'error'}});
