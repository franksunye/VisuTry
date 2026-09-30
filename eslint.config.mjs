import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([{
    extends: [...nextCoreWebVitals],
    rules: {
        // These React Compiler diagnostics are stricter than the former
        // `next lint` contract and are intentionally deferred from W2.
        "react-hooks/error-boundaries": "off",
        "react-hooks/immutability": "off",
        "react-hooks/purity": "off",
        "react-hooks/refs": "off",
        "react-hooks/set-state-in-effect": "off",
        "react-hooks/static-components": "off",
        "@next/next/no-html-link-for-pages": "warn",
        "@next/next/no-location-assign-relative-destination": "warn",
    },
}]);
