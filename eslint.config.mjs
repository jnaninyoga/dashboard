import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tailwindcss from "eslint-plugin-tailwindcss";
import unusedImports from "eslint-plugin-unused-imports";

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	...tailwindcss.configs["flat/recommended"],
	{
		plugins: {
			"unused-imports": unusedImports,
			"simple-import-sort": simpleImportSort,
		},
		rules: {
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"unused-imports/no-unused-imports": "error",
			"unused-imports/no-unused-vars": [
				"warn",
				{
					vars: "all",
					varsIgnorePattern: "^_",
					args: "after-used",
					argsIgnorePattern: "^_",
				},
			],
			"simple-import-sort/imports": [
				"error",
				{
					groups: [
						// Side effect imports.
						["^\\u0000"],
						// Node.js built-ins prefixed with `node:`.
						["^node:"],
						// `react` related packages come first.
						["^react", "^next"],
						// Internal packages.
						["^@/"],
						// Other internal packages.
						["^@?\\w"],
						// Side effect imports.
						["^\\u0000"],
						// Parent imports. Put `..` last.
						["^\\.\\.(?!/?$)", "^\\.\\./?$"],
						// Other relative imports. Put same-folder imports and `.` last.
						["^\\./(?=[^/]*$)", "^\\.(?!/?$)", "^\\./?$"],
						// Style imports.
						["^.+\\.css$"],
					],
				},
			],
			"simple-import-sort/exports": "error",
			"tailwindcss/classnames-order": "error",
			"tailwindcss/enforces-negative-arbitrary-values": "error",
			"tailwindcss/enforces-shorthand": "error",
			"tailwindcss/no-custom-classname": "off",
			// Vercel Best Practices: Prefer ternary over && for conditional rendering
			"no-restricted-syntax": [
				"error",
				{
					selector: "JSXElement > JSXExpressionContainer > LogicalExpression[operator='&&']",
					message: "Prefer ternary over && for conditional rendering to avoid accidental falsy values in DOM.",
				},
			],
		},
		settings: {
			tailwindcss: {
				callees: ["cn", "cva"],
				cssFiles: ["styles/globals.css"],
				config: {},
			},
		},
	},
	// Override rules for UI components (Shadcn)
	{
		files: ["components/ui/**"],
		rules: {
			"tailwindcss/classnames-order": "off",
			"tailwindcss/enforces-negative-arbitrary-values": "off",
			"tailwindcss/enforces-shorthand": "off",
			"tailwindcss/no-custom-classname": "off",
			"tailwindcss/no-contradicting-classname": "off",
		},
	},
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		".next/**",
		"out/**",
		"build/**",
		"next-env.d.ts",
		"components/ui/**",
		"lib/hooks/**",
		"lib/scripts/**",
	]),
]);

export default eslintConfig;
