const { addReleaseSigningConfig } = require('../withReleaseSigning');

const PRISTINE_BUILD_GRADLE = [
  'android {',
  '    signingConfigs {',
  '        debug {',
  '            storeFile file("debug.keystore")',
  '            storePassword "android"',
  '            keyAlias "androiddebugkey"',
  '            keyPassword "android"',
  '        }',
  '    }',
  '    buildTypes {',
  '        debug {',
  '            signingConfig signingConfigs.debug',
  '        }',
  '        release {',
  '            signingConfig signingConfigs.debug',
  '            minifyEnabled true',
  '        }',
  '    }',
  '}',
].join('\n');

describe('withReleaseSigning / addReleaseSigningConfig', () => {
  it('inserta un signingConfig release que lee keystore.properties', () => {
    const out = addReleaseSigningConfig(PRISTINE_BUILD_GRADLE);
    expect(out).toContain("rootProject.file('keystore.properties')");
    expect(out).toContain('RELEASE_STORE_FILE');
  });

  it('apunta el buildType release al keystore de release con fallback a debug', () => {
    const out = addReleaseSigningConfig(PRISTINE_BUILD_GRADLE);
    expect(out).toContain('? signingConfigs.release : signingConfigs.debug');
  });

  it('conserva el signingConfig y el buildType de debug', () => {
    const out = addReleaseSigningConfig(PRISTINE_BUILD_GRADLE);
    expect(out).toContain('androiddebugkey');
    expect(out).toMatch(/debug\s*\{\s*signingConfig signingConfigs\.debug/);
  });

  it('es idempotente: aplicarlo dos veces no duplica el bloque', () => {
    const once = addReleaseSigningConfig(PRISTINE_BUILD_GRADLE);
    const twice = addReleaseSigningConfig(once);
    expect((twice.match(/withInputStream/g) || []).length).toBe(1);
    expect(twice).toBe(once);
  });

  it('lanza si no encuentra el bloque signingConfigs.debug', () => {
    expect(() => addReleaseSigningConfig('android {\n}')).toThrow(/signingConfigs\.debug/);
  });
});
