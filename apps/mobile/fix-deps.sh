#!/bin/bash
# Script de corrección automática de dependencias - Horus Mobile

set -e

echo "🔧 Iniciando corrección de compatibilidad..."

# Ir al directorio mobile
cd "$(dirname "$0")"

echo ""
echo "📦 Paso 1: Actualizando dependencias de Expo SDK 54..."
npx expo install --check --fix

echo ""
echo "🗑️  Paso 2: Removiendo dependencias innecesarias..."
pnpm remove @types/react-native || true

echo ""
echo "♻️  Paso 3: Reinstalando dependencias..."
cd ../..
pnpm install

echo ""
echo "🔍 Paso 4: Verificando estado del proyecto..."
cd apps/mobile
npx expo-doctor || echo "⚠️  Aún quedan advertencias (revisa assets y google-services.json)"

echo ""
echo "✅ Corrección completada!"
echo ""
echo "📋 Siguientes pasos:"
echo "   1. Crear assets faltantes en apps/mobile/assets/"
echo "   2. Configurar google-services.json para Firebase"
echo "   3. Ejecutar: eas build --platform android --profile preview"
