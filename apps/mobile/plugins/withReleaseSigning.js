const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Config plugin: reinyecta la firma de RELEASE en android/app/build.gradle en
 * cada `expo prebuild`, para que no se pierda al regenerar la carpeta android/.
 *
 * Lee las credenciales desde android/keystore.properties (no versionado) o desde
 * variables de entorno. Si no hay keystore configurado, el release cae al debug
 * keystore (apto solo para builds locales, NUNCA para publicar).
 *
 * Ver android/keystore.properties.example para el formato y cómo generar el
 * keystore de release.
 */

const RELEASE_SIGNING_CONFIG = `
        release {
            def keystorePropsFile = rootProject.file('keystore.properties')
            if (keystorePropsFile.exists()) {
                def props = new Properties()
                keystorePropsFile.withInputStream { props.load(it) }
                storeFile file(props['RELEASE_STORE_FILE'])
                storePassword props['RELEASE_STORE_PASSWORD']
                keyAlias props['RELEASE_KEY_ALIAS']
                keyPassword props['RELEASE_KEY_PASSWORD']
            } else if (System.getenv('RELEASE_STORE_FILE')) {
                storeFile file(System.getenv('RELEASE_STORE_FILE'))
                storePassword System.getenv('RELEASE_STORE_PASSWORD')
                keyAlias System.getenv('RELEASE_KEY_ALIAS')
                keyPassword System.getenv('RELEASE_KEY_PASSWORD')
            }
        }
    }`;

function addReleaseSigningConfig(contents) {
  // Ya aplicado (idempotente): no duplicar.
  if (contents.includes("rootProject.file('keystore.properties')")) {
    return contents;
  }

  // 1) Insertar el signingConfig `release` junto al `debug` existente.
  const debugSigningRegex = /(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\}\n)(\s*\})/;
  if (!debugSigningRegex.test(contents)) {
    throw new Error(
      '[withReleaseSigning] no se encontró el bloque signingConfigs.debug en build.gradle'
    );
  }
  let next = contents.replace(debugSigningRegex, `$1${RELEASE_SIGNING_CONFIG}`);

  // 2) En buildTypes.release, apuntar al signingConfig de release si hay keystore.
  next = next.replace(
    /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
    `$1signingConfig (rootProject.file('keystore.properties').exists() || System.getenv('RELEASE_STORE_FILE') != null) ? signingConfigs.release : signingConfigs.debug`
  );

  return next;
}

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('[withReleaseSigning] solo soporta build.gradle en Groovy');
    }
    cfg.modResults.contents = addReleaseSigningConfig(cfg.modResults.contents);
    return cfg;
  });
}

module.exports = withReleaseSigning;
// Exportado para tests; la lógica de transformación es pura.
module.exports.addReleaseSigningConfig = addReleaseSigningConfig;
