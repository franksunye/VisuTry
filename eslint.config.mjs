import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([{
    extends: [...nextCoreWebVitals],
    rules: {
        // These Next 16 React Compiler diagnostics are explicitly deferred
        // from W2-F1. A strict scan counted 51 findings: 3 error-boundaries,
        // 4 immutability, 6 purity, 3 refs, 30 set-state-in-effect, and 5
        // static-components. This deferral is not equivalent to strict lint.
        "react-hooks/error-boundaries": "off",
        "react-hooks/immutability": "off",
        "react-hooks/purity": "off",
        "react-hooks/refs": "off",
        "react-hooks/set-state-in-effect": "off",
        "react-hooks/static-components": "off",
    },
}]);
