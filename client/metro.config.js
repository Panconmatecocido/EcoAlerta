const { getDefaultConfig } = require('expo/metro-config');

const configuracion = getDefaultConfig(__dirname);

// Permite usar las ilustraciones .jfif de assets/
configuracion.resolver.assetExts.push('jfif');

module.exports = configuracion;
