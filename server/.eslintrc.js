module.exports = {
	parser: '@typescript-eslint/parser', // Specifies the ESLint parser
	extends: [
		'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
		'prettier/@typescript-eslint',
		'plugin:prettier/recommended',
	],
	rules: {
		// I prefer SwitchCase: 0, but prettier is stubborn and I don't want to fight right now
		indent: ['error', 'tab', { SwitchCase: 1 }],
		'@typescript-eslint/indent': ['error', 'tab', { SwitchCase: 1 }],
	},
};
