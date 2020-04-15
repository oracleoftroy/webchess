module.exports = {
    parser: "@typescript-eslint/parser", // Specifies the ESLint parser
    extends: [
        "plugin:@typescript-eslint/recommended", // Uses the recommended rules from the @typescript-eslint/eslint-plugin
        "prettier/@typescript-eslint",
        "plugin:prettier/recommended",
    ],
    rules: {
        indent: ["error", "tab"],
        "@typescript-eslint/indent": ["error", "tab"],
    },
};
