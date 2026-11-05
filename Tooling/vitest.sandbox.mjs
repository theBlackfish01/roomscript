// Avoid bundling configuration through esbuild's parent-directory resolution.
export default {test:{environment:"node",include:["tests/**/*.test.{ts,js,mjs}"],testTimeout:15000}};
