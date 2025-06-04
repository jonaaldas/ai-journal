const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)
config.resolver.unstable_enablePackageExports = false
config.resolver.sourceExts.push('sql')
module.exports = withNativeWind(config, { input: './assets/css/global.css' })
