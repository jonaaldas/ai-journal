const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config')
/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)
config.resolver.unstable_enablePackageExports = false
config.resolver.sourceExts.push('sql')

config.resolver.platforms = ['ios', 'android', 'native']

module.exports = wrapWithReanimatedMetroConfig(withNativeWind(config, { input: './assets/css/global.css' }))

