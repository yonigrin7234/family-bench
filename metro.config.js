const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib' && context.originModulePath.replace(/\\/g, '/').includes('/node_modules/pdf-lib/')) {
    // pdf-lib's tslib 1.x "import" shim default-imports a UMD module that marks
    // itself __esModule but has no default export. Metro then fails on __extends
    // when an export is first opened. Use tslib's own complete ESM entry instead.
    // Keep the package/version selected from this importer and normal resolution
    // for every other dependency: https://metrobundler.dev/docs/package-exports/
    return context.resolveRequest({
      ...context,
      unstable_conditionNames: [...context.unstable_conditionNames, 'module'],
    }, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
