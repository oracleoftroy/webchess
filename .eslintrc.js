module.exports = {
	parser: '@typescript-eslint/parser', // Specifies the ESLint parser
	plugins: ['react-hooks'],
	extends: [
		'plugin:react/recommended', // Uses the recommended rules from @eslint-plugin-react
		'plugin:@typescript-eslint/recommended', // Uses the recommended rules from @typescript-eslint/eslint-plugin
	],
	parserOptions: {
		ecmaFeatures: {
			jsx: true, // Allows for the parsing of JSX
		},
	},
	rules: {
		indent: ['error', 'tab'],
		'react-hooks/rules-of-hooks': 'warn',
		'react-hooks/exhaustive-deps': 'warn',
	},
	settings: {
		react: {
			version: 'detect', // Tells eslint-plugin-react to automatically detect the version of React to use
		},
	},
};
