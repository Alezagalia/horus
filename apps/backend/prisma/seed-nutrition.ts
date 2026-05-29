/**
 * Seed de nutrición: 20 recetas saludables para congelador
 * Para 3 personas (2 adultos + 1 niño de 4 años)
 * Ejecutar: cd apps/backend && npx tsx prisma/seed-nutrition.ts
 */
import 'dotenv/config'; // carga .env antes de que prisma.ts acceda a process.env
import { prisma } from '../src/lib/prisma.js';

// ─────────────────────────────────────────────
// Tipos helpers
// ─────────────────────────────────────────────

interface FoodData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  unit: string;
}

interface IngredientData {
  name: string;
  grams: number;
  notes?: string;
}

interface RecipeData {
  name: string;
  description: string;
  servings: number;
  ingredients: IngredientData[];
}

// ─────────────────────────────────────────────
// ALIMENTOS — valores nutricionales por 100 g / 100 ml
// ─────────────────────────────────────────────

const foodsData: FoodData[] = [
  // Proteínas animales
  {
    name: 'Carne molida de pavo',
    calories: 170,
    protein: 20.0,
    carbs: 0,
    fat: 9.4,
    fiber: 0,
    unit: 'g',
  },
  {
    name: 'Pechuga de pollo',
    calories: 165,
    protein: 31.0,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    unit: 'g',
  },
  {
    name: 'Carne molida de res magra',
    calories: 215,
    protein: 26.1,
    carbs: 0,
    fat: 12.0,
    fiber: 0,
    unit: 'g',
  },
  {
    name: 'Filete de merluza',
    calories: 82,
    protein: 16.5,
    carbs: 0,
    fat: 1.5,
    fiber: 0,
    unit: 'g',
  },
  { name: 'Chorizo', calories: 350, protein: 22.0, carbs: 3.0, fat: 28.0, fiber: 0, unit: 'g' },
  {
    name: 'Carne de res en cubos',
    calories: 200,
    protein: 22.0,
    carbs: 0,
    fat: 12.0,
    fiber: 0,
    unit: 'g',
  },
  {
    name: 'Huevo entero',
    calories: 155,
    protein: 12.6,
    carbs: 1.1,
    fat: 10.6,
    fiber: 0,
    unit: 'g',
  },

  // Legumbres
  {
    name: 'Lentejas secas',
    calories: 353,
    protein: 25.8,
    carbs: 60.1,
    fat: 1.1,
    fiber: 10.7,
    unit: 'g',
  },
  {
    name: 'Garbanzos cocidos',
    calories: 164,
    protein: 8.9,
    carbs: 27.4,
    fat: 2.6,
    fiber: 7.6,
    unit: 'g',
  },
  {
    name: 'Porotos rojos cocidos',
    calories: 127,
    protein: 8.7,
    carbs: 22.8,
    fat: 0.5,
    fiber: 7.4,
    unit: 'g',
  },

  // Verduras
  { name: 'Cebolla', calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, unit: 'g' },
  { name: 'Ajo', calories: 149, protein: 6.4, carbs: 33.1, fat: 0.5, fiber: 2.1, unit: 'g' },
  { name: 'Zanahoria', calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, unit: 'g' },
  {
    name: 'Pimiento rojo',
    calories: 31,
    protein: 1.0,
    carbs: 6.0,
    fat: 0.3,
    fiber: 2.1,
    unit: 'g',
  },
  {
    name: 'Tomate fresco',
    calories: 18,
    protein: 0.9,
    carbs: 3.9,
    fat: 0.2,
    fiber: 1.2,
    unit: 'g',
  },
  { name: 'Espinacas', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, unit: 'g' },
  { name: 'Zapallo', calories: 26, protein: 1.0, carbs: 6.5, fat: 0.1, fiber: 0.5, unit: 'g' },
  { name: 'Berenjena', calories: 25, protein: 1.0, carbs: 5.9, fat: 0.2, fiber: 3.0, unit: 'g' },
  { name: 'Champiñones', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1.0, unit: 'g' },
  { name: 'Brócoli', calories: 34, protein: 2.8, carbs: 7.0, fat: 0.4, fiber: 2.6, unit: 'g' },
  { name: 'Papa', calories: 77, protein: 2.0, carbs: 17.0, fat: 0.1, fiber: 2.2, unit: 'g' },
  { name: 'Batata', calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, fiber: 3.0, unit: 'g' },
  { name: 'Apio', calories: 16, protein: 0.7, carbs: 3.0, fat: 0.2, fiber: 1.6, unit: 'g' },
  { name: 'Puerro', calories: 61, protein: 1.5, carbs: 14.2, fat: 0.3, fiber: 1.8, unit: 'g' },
  {
    name: 'Cebolla de verdeo',
    calories: 32,
    protein: 1.8,
    carbs: 7.3,
    fat: 0.2,
    fiber: 2.6,
    unit: 'g',
  },

  // Enlatados y concentrados
  {
    name: 'Tomate triturado en lata',
    calories: 32,
    protein: 1.6,
    carbs: 7.1,
    fat: 0.3,
    fiber: 1.8,
    unit: 'g',
  },
  {
    name: 'Concentrado de tomate',
    calories: 82,
    protein: 4.3,
    carbs: 18.9,
    fat: 0.5,
    fiber: 4.1,
    unit: 'g',
  },
  {
    name: 'Aceitunas verdes',
    calories: 145,
    protein: 1.0,
    carbs: 3.8,
    fat: 15.3,
    fiber: 3.3,
    unit: 'g',
  },

  // Cereales, harinas y pastas
  {
    name: 'Arroz blanco',
    calories: 365,
    protein: 7.0,
    carbs: 80.0,
    fat: 0.7,
    fiber: 1.3,
    unit: 'g',
  },
  {
    name: 'Arroz integral',
    calories: 362,
    protein: 7.5,
    carbs: 75.6,
    fat: 2.7,
    fiber: 3.5,
    unit: 'g',
  },
  {
    name: 'Pasta seca',
    calories: 371,
    protein: 13.0,
    carbs: 74.7,
    fat: 1.5,
    fiber: 3.2,
    unit: 'g',
  },
  {
    name: 'Fideos para lasaña',
    calories: 371,
    protein: 13.0,
    carbs: 74.7,
    fat: 1.5,
    fiber: 3.2,
    unit: 'g',
  },
  {
    name: 'Harina de trigo',
    calories: 364,
    protein: 10.3,
    carbs: 76.3,
    fat: 1.0,
    fiber: 2.7,
    unit: 'g',
  },
  {
    name: 'Pan rallado',
    calories: 395,
    protein: 13.0,
    carbs: 74.0,
    fat: 4.0,
    fiber: 3.5,
    unit: 'g',
  },
  { name: 'Maicena', calories: 381, protein: 0.3, carbs: 91.3, fat: 0.1, fiber: 0.9, unit: 'g' },

  // Lácteos
  { name: 'Leche entera', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, unit: 'ml' },
  {
    name: 'Crema de leche',
    calories: 292,
    protein: 2.1,
    carbs: 3.1,
    fat: 30.0,
    fiber: 0,
    unit: 'ml',
  },
  { name: 'Manteca', calories: 717, protein: 0.9, carbs: 0.1, fat: 81.1, fiber: 0, unit: 'g' },
  {
    name: 'Queso rallado',
    calories: 392,
    protein: 25.0,
    carbs: 1.3,
    fat: 32.0,
    fiber: 0,
    unit: 'g',
  },
  { name: 'Ricota', calories: 174, protein: 11.3, carbs: 3.0, fat: 13.0, fiber: 0, unit: 'g' },
  { name: 'Mozzarella', calories: 280, protein: 17.0, carbs: 2.2, fat: 22.0, fiber: 0, unit: 'g' },

  // Aceites y grasas
  {
    name: 'Aceite de oliva',
    calories: 884,
    protein: 0,
    carbs: 0,
    fat: 100.0,
    fiber: 0,
    unit: 'ml',
  },
  {
    name: 'Aceite de sésamo',
    calories: 884,
    protein: 0,
    carbs: 0,
    fat: 100.0,
    fiber: 0,
    unit: 'ml',
  },

  // Condimentos y salsas
  {
    name: 'Salsa de soja',
    calories: 53,
    protein: 8.1,
    carbs: 4.9,
    fat: 0.6,
    fiber: 0.8,
    unit: 'ml',
  },
  { name: 'Mostaza', calories: 66, protein: 4.4, carbs: 5.8, fat: 3.3, fiber: 3.3, unit: 'g' },
  { name: 'Vino blanco', calories: 82, protein: 0.1, carbs: 2.6, fat: 0, fiber: 0, unit: 'ml' },

  // Especias y hierbas
  { name: 'Sal', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, unit: 'g' },
  {
    name: 'Pimienta negra',
    calories: 251,
    protein: 10.4,
    carbs: 63.9,
    fat: 3.3,
    fiber: 25.3,
    unit: 'g',
  },
  {
    name: 'Pimentón dulce',
    calories: 282,
    protein: 14.1,
    carbs: 53.9,
    fat: 12.9,
    fiber: 34.9,
    unit: 'g',
  },
  {
    name: 'Pimentón ahumado',
    calories: 282,
    protein: 14.1,
    carbs: 53.9,
    fat: 12.9,
    fiber: 34.9,
    unit: 'g',
  },
  { name: 'Cúrcuma', calories: 312, protein: 9.7, carbs: 67.1, fat: 3.2, fiber: 22.7, unit: 'g' },
  {
    name: 'Comino molido',
    calories: 375,
    protein: 17.8,
    carbs: 44.2,
    fat: 22.3,
    fiber: 10.5,
    unit: 'g',
  },
  {
    name: 'Orégano seco',
    calories: 265,
    protein: 9.0,
    carbs: 68.9,
    fat: 4.3,
    fiber: 42.5,
    unit: 'g',
  },
  {
    name: 'Perejil fresco',
    calories: 36,
    protein: 3.0,
    carbs: 6.3,
    fat: 0.8,
    fiber: 3.3,
    unit: 'g',
  },
  {
    name: 'Tomillo seco',
    calories: 276,
    protein: 9.1,
    carbs: 63.9,
    fat: 7.4,
    fiber: 37.0,
    unit: 'g',
  },
  { name: 'Laurel', calories: 313, protein: 7.6, carbs: 74.9, fat: 8.4, fiber: 26.3, unit: 'g' },
  {
    name: 'Curry en polvo',
    calories: 325,
    protein: 14.3,
    carbs: 55.8,
    fat: 14.0,
    fiber: 33.2,
    unit: 'g',
  },
  {
    name: 'Nuez moscada',
    calories: 525,
    protein: 5.8,
    carbs: 49.3,
    fat: 36.3,
    fiber: 20.8,
    unit: 'g',
  },
  {
    name: 'Jengibre fresco',
    calories: 80,
    protein: 1.8,
    carbs: 18.0,
    fat: 0.8,
    fiber: 2.0,
    unit: 'g',
  },
  { name: 'Limón', calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3, fiber: 2.8, unit: 'g' },
  {
    name: 'Caldo de pollo (pastilla)',
    calories: 230,
    protein: 7.0,
    carbs: 38.0,
    fat: 7.0,
    fiber: 0,
    unit: 'g',
  },
  {
    name: 'Caldo de verduras (pastilla)',
    calories: 160,
    protein: 5.0,
    carbs: 30.0,
    fat: 3.0,
    fiber: 0,
    unit: 'g',
  },
];

// ─────────────────────────────────────────────
// RECETAS — 6 porciones c/u (comer 2-3 y congelar el resto)
// ─────────────────────────────────────────────

const recipesData: RecipeData[] = [
  // ──────────────────────────────────────────
  // 1. Albóndigas de pavo en salsa de tomate
  // ──────────────────────────────────────────
  {
    name: 'Albóndigas de pavo en salsa de tomate',
    servings: 6,
    description: `Albóndigas jugosas de carne de pavo en salsa de tomate casera. Suaves, nutritivas y perfectas para toda la familia, especialmente para los más pequeños.

PREPARACIÓN:
1. Mezclar la carne de pavo con el pan rallado, los huevos, el ajo picado, el perejil picado, sal y pimienta hasta integrar bien.
2. Formar albóndigas del tamaño de una nuez (aprox. 3-4 cm de diámetro).
3. En una sartén grande, calentar aceite de oliva y dorar las albóndigas por todos los lados a fuego medio-alto. Reservar.
4. En la misma sartén, sofreír la cebolla picada fina hasta que esté transparente (5-7 min).
5. Agregar el tomate triturado, orégano, sal y pimienta. Cocinar 10 minutos a fuego medio.
6. Incorporar las albóndigas a la salsa. Cocinar 20 minutos más a fuego bajo con la tapa puesta.

TIPS PARA EL NIÑO: Hacer las albóndigas más pequeñas (tamaño cherry) para que sean más fáciles de comer.

PARA CONGELAR: Dejar enfriar completamente (mínimo 30 min). Dividir en porciones en recipientes herméticos o bolsas con cierre. Etiquetar con nombre y fecha. Se conservan hasta 3 meses.

PARA RECALENTAR: Descongelar en heladera la noche anterior. Calentar en sartén a fuego bajo con un chorrito de agua, o en microondas 3-4 minutos, removiendo a mitad de cocción.`,
    ingredients: [
      { name: 'Carne molida de pavo', grams: 800, notes: 'temperatura ambiente' },
      { name: 'Pan rallado', grams: 80 },
      { name: 'Huevo entero', grams: 110, notes: '2 huevos grandes' },
      { name: 'Ajo', grams: 10, notes: 'picado fino' },
      { name: 'Perejil fresco', grams: 15, notes: 'picado fino' },
      { name: 'Tomate triturado en lata', grams: 800 },
      { name: 'Cebolla', grams: 200, notes: 'picada fina' },
      { name: 'Aceite de oliva', grams: 40 },
      { name: 'Orégano seco', grams: 5 },
      { name: 'Sal', grams: 8 },
      { name: 'Pimienta negra', grams: 3 },
    ],
  },

  // ──────────────────────────────────────────
  // 2. Pollo al curry con vegetales
  // ──────────────────────────────────────────
  {
    name: 'Pollo al curry con vegetales',
    servings: 6,
    description: `Guiso aromático de pollo con verduras en salsa de curry suave. Rico en proteínas y fibra, con un sabor que toda la familia va a disfrutar.

PREPARACIÓN:
1. Cortar el pollo en cubos de 3 cm. Reservar.
2. En una olla grande, calentar el aceite de oliva y sofreír la cebolla picada hasta dorar (5 min).
3. Agregar el ajo y el jengibre rallado. Cocinar 1 minuto.
4. Añadir el curry en polvo y revolver 1 minuto para tostar las especias.
5. Incorporar el pollo y dorar por todos los lados.
6. Agregar el pimiento rojo en tiras, la zanahoria en rodajas y el tomate triturado. Revolver bien.
7. Cubrir y cocinar a fuego bajo 25 minutos.
8. Agregar la crema de leche, ajustar sal y cocinar 5 minutos más sin tapa.
9. Servir con arroz blanco o pan.

TIPS PARA EL NIÑO: Usar solo 1 cucharadita de curry para una versión más suave. Se puede reemplazar la crema por leche entera si se prefiere menos grasoso.

PARA CONGELAR: Enfriar completamente. Conservar sin el arroz (cocinarlo fresco cada vez). Dura hasta 3 meses.

PARA RECALENTAR: Descongelar en heladera. Calentar en sartén a fuego medio con un poco de agua o caldo.`,
    ingredients: [
      { name: 'Pechuga de pollo', grams: 750, notes: 'cortada en cubos de 3 cm' },
      { name: 'Cebolla', grams: 250, notes: 'picada' },
      { name: 'Pimiento rojo', grams: 300, notes: 'en tiras' },
      { name: 'Zanahoria', grams: 250, notes: 'en rodajas' },
      { name: 'Tomate triturado en lata', grams: 400 },
      { name: 'Crema de leche', grams: 200 },
      { name: 'Aceite de oliva', grams: 40 },
      { name: 'Curry en polvo', grams: 15 },
      { name: 'Ajo', grams: 15, notes: 'rallado o picado' },
      { name: 'Jengibre fresco', grams: 20, notes: 'rallado' },
      { name: 'Sal', grams: 8 },
    ],
  },

  // ──────────────────────────────────────────
  // 3. Sopa de lentejas con espinacas
  // ──────────────────────────────────────────
  {
    name: 'Sopa de lentejas con espinacas',
    servings: 6,
    description: `Sopa espesa y nutritiva de lentejas con espinacas y verduras. Fuente excelente de hierro, fibra y proteína vegetal. Ideal para preparar en cantidad y congelar.

PREPARACIÓN:
1. Remojar las lentejas en agua fría 1 hora antes (opcional, acorta la cocción).
2. En una olla grande, calentar el aceite y sofreír la cebolla picada hasta transparente.
3. Agregar el ajo picado, el pimentón dulce y el comino. Cocinar 1 minuto removiendo.
4. Incorporar la zanahoria en cubos pequeños y rehogar 2 minutos.
5. Agregar las lentejas escurridas, el tomate triturado, la pastilla de caldo y 1.5 litros de agua.
6. Llevar a hervor, luego cocinar a fuego bajo 35-40 minutos hasta que las lentejas estén tiernas.
7. Agregar las espinacas lavadas, mezclar y cocinar 3 minutos más.
8. Ajustar sal y consistencia con agua si es necesario.

TIPS PARA EL NIÑO: Mixear una parte de la sopa para que tenga textura cremosa más aceptable para los pequeños.

PARA CONGELAR: Dividir en porciones individuales. No ocupa mucho espacio. Se conserva hasta 4 meses.

PARA RECALENTAR: Calentar directamente en olla con un poco de agua o caldo, revolviendo para que no se pegue.`,
    ingredients: [
      { name: 'Lentejas secas', grams: 400, notes: 'remojadas 1 hora' },
      { name: 'Espinacas', grams: 300, notes: 'lavadas y sin tallos gruesos' },
      { name: 'Cebolla', grams: 200, notes: 'picada' },
      { name: 'Zanahoria', grams: 200, notes: 'en cubos pequeños' },
      { name: 'Tomate triturado en lata', grams: 300 },
      { name: 'Ajo', grams: 12, notes: 'picado' },
      { name: 'Aceite de oliva', grams: 35 },
      { name: 'Pimentón dulce', grams: 8 },
      { name: 'Comino molido', grams: 5 },
      { name: 'Sal', grams: 10 },
      { name: 'Caldo de verduras (pastilla)', grams: 15 },
    ],
  },

  // ──────────────────────────────────────────
  // 4. Lasaña de verduras con salsa bechamel
  // ──────────────────────────────────────────
  {
    name: 'Lasaña de verduras con salsa bechamel',
    servings: 6,
    description: `Lasaña vegetariana con capas de espinacas, champiñones, salsa de tomate y bechamel casera. Se puede preparar el fin de semana, congelar por porciones y disfrutar durante la semana.

PREPARACIÓN:
1. Sofreír la cebolla y el ajo en aceite hasta transparentes. Agregar los champiñones laminados y cocinar 8 min.
2. Agregar las espinacas, rehogar hasta que se marchiten. Incorporar el tomate triturado, orégano, sal y pimienta. Cocinar 10 min. Reservar.
3. Bechamel: derretir la manteca en olla. Agregar la harina de golpe y revolver 2 min a fuego bajo. Agregar la leche tibia de a poco sin dejar de revolver. Cocinar hasta espesar. Sazonar con sal, pimienta y nuez moscada.
4. Precalentar horno a 180°C.
5. En fuente para horno: capa de salsa de tomate, fideos de lasaña (sin precocinar si son instantáneos), capa de relleno de verduras, capa de ricota, bechamel. Repetir capas.
6. Terminar con bechamel, mozzarella y queso rallado.
7. Cubrir con papel aluminio y hornear 35 min. Destapar y gratinar 10 min más.

PARA CONGELAR: Dejar enfriar completamente. Cortar en porciones individuales y envolver en film + papel aluminio. Dura hasta 3 meses.

PARA RECALENTAR: En horno a 180°C cubierta con papel aluminio por 25 min, o microondas 5-6 min.`,
    ingredients: [
      { name: 'Fideos para lasaña', grams: 300 },
      { name: 'Espinacas', grams: 400, notes: 'lavadas y picadas gruesas' },
      { name: 'Champiñones', grams: 400, notes: 'laminados' },
      { name: 'Cebolla', grams: 150, notes: 'picada' },
      { name: 'Tomate triturado en lata', grams: 600 },
      { name: 'Ricota', grams: 300 },
      { name: 'Mozzarella', grams: 200, notes: 'rallada o en rebanadas' },
      { name: 'Queso rallado', grams: 80 },
      { name: 'Ajo', grams: 10, notes: 'picado' },
      { name: 'Aceite de oliva', grams: 40 },
      { name: 'Orégano seco', grams: 5 },
      { name: 'Nuez moscada', grams: 3 },
      { name: 'Leche entera', grams: 400, notes: 'para la bechamel' },
      { name: 'Harina de trigo', grams: 40, notes: 'para la bechamel' },
      { name: 'Manteca', grams: 40, notes: 'para la bechamel' },
      { name: 'Sal', grams: 8 },
      { name: 'Pimienta negra', grams: 3 },
    ],
  },

  // ──────────────────────────────────────────
  // 5. Cazuela de garbanzos con chorizo
  // ──────────────────────────────────────────
  {
    name: 'Cazuela de garbanzos con chorizo',
    servings: 6,
    description: `Guiso reconfortante de garbanzos con chorizo y verduras. Rico en proteínas y fibra, con un sabor intenso y sabroso. Uno de los platos que mejor se conserva congelado.

PREPARACIÓN:
1. Calentar el aceite en una olla grande. Saltear el chorizo cortado en rodajas hasta que suelte su grasa (3-4 min). Retirar y reservar.
2. En el mismo aceite, sofreír la cebolla y el pimiento rojo picados hasta ablandar.
3. Agregar el ajo, el pimentón dulce y el pimentón ahumado. Revolver 1 minuto.
4. Incorporar la zanahoria en rodajas, el tomate triturado, la pastilla de caldo y las hojas de laurel.
5. Añadir los garbanzos cocidos y el chorizo reservado.
6. Cubrir con agua caliente hasta nivel de los garbanzos.
7. Cocinar a fuego bajo 30 minutos. Ajustar sal.

TIPS PARA EL NIÑO: Retirar el chorizo de la porción del niño si le resulta muy intenso, o usar chorizo suave de pollo.

PARA CONGELAR: Enfriar y dividir en porciones. Se conserva hasta 4 meses. El guiso mejora al recalentar.

PARA RECALENTAR: En olla a fuego bajo con un poco de agua, revolviendo suave para no deshacer los garbanzos.`,
    ingredients: [
      { name: 'Garbanzos cocidos', grams: 800 },
      { name: 'Chorizo', grams: 300, notes: 'en rodajas' },
      { name: 'Cebolla', grams: 200, notes: 'picada' },
      { name: 'Pimiento rojo', grams: 200, notes: 'en cubos' },
      { name: 'Zanahoria', grams: 200, notes: 'en rodajas' },
      { name: 'Tomate triturado en lata', grams: 400 },
      { name: 'Ajo', grams: 15, notes: 'picado' },
      { name: 'Aceite de oliva', grams: 30 },
      { name: 'Pimentón dulce', grams: 8 },
      { name: 'Pimentón ahumado', grams: 5 },
      { name: 'Laurel', grams: 3, notes: '2-3 hojas' },
      { name: 'Sal', grams: 8 },
      { name: 'Caldo de verduras (pastilla)', grams: 10 },
    ],
  },

  // ──────────────────────────────────────────
  // 6. Guiso de carne con papas y zanahorias
  // ──────────────────────────────────────────
  {
    name: 'Guiso de carne con papas y zanahorias',
    servings: 6,
    description: `Guiso casero clásico de carne de res con papas y zanahorias. Reconfortante, completo y muy fácil de recalentar. Perfecto para toda la familia.

PREPARACIÓN:
1. Cortar la carne en cubos de 3-4 cm. Salpimentar.
2. En una olla grande o cacerola, calentar el aceite a fuego alto. Sellar la carne en tandas hasta dorar todos los lados. Retirar y reservar.
3. En el mismo recipiente, sofreír la cebolla hasta transparente. Agregar el ajo y el pimentón dulce. Cocinar 1 min.
4. Incorporar el tomate triturado, el laurel, el tomillo y la pastilla de caldo. Revolver.
5. Volver a poner la carne. Cubrir con agua caliente (aprox. 500 ml).
6. Tapar y cocinar a fuego bajo 45 minutos.
7. Agregar la papa y la zanahoria en cubos medianos. Cocinar 20-25 minutos más hasta que las verduras estén tiernas.
8. Ajustar sal y consistencia. Retirar el laurel antes de servir.

TIPS PARA EL NIÑO: Cortar las papas y zanahorias en cubos pequeños para que sean más fáciles de comer.

PARA CONGELAR: Enfriar completamente. Dividir en recipientes de vidrio o bolsas. Conserva hasta 3 meses.

PARA RECALENTAR: Descongelar en heladera. Calentar en olla a fuego bajo con un poco de agua, revolviendo con cuidado.`,
    ingredients: [
      { name: 'Carne de res en cubos', grams: 700 },
      { name: 'Papa', grams: 600, notes: 'en cubos medianos' },
      { name: 'Zanahoria', grams: 400, notes: 'en rodajas o cubos' },
      { name: 'Cebolla', grams: 200, notes: 'picada' },
      { name: 'Tomate triturado en lata', grams: 400 },
      { name: 'Ajo', grams: 15, notes: 'picado' },
      { name: 'Aceite de oliva', grams: 40 },
      { name: 'Pimentón dulce', grams: 8 },
      { name: 'Laurel', grams: 3, notes: '2 hojas' },
      { name: 'Tomillo seco', grams: 3 },
      { name: 'Caldo de pollo (pastilla)', grams: 15 },
      { name: 'Sal', grams: 10 },
      { name: 'Pimienta negra', grams: 3 },
    ],
  },

  // ──────────────────────────────────────────
  // 7. Chili con carne suave
  // ──────────────────────────────────────────
  {
    name: 'Chili con carne suave',
    servings: 6,
    description: `Chili con carne versión suave, sin picante, apto para niños. Rico en proteínas y legumbres. Se conserva perfectamente congelado y mejora el sabor al día siguiente.

PREPARACIÓN:
1. En una olla grande, calentar el aceite y saltear la cebolla y el pimiento rojo picados hasta ablandar.
2. Agregar el ajo picado y cocinar 1 minuto.
3. Incorporar la carne molida y cocinar a fuego alto, desmenuzando con cuchara de madera, hasta dorar completamente.
4. Añadir el comino molido, el pimentón dulce y el concentrado de tomate. Revolver bien.
5. Agregar los porotos rojos y el tomate triturado.
6. Disolver la pastilla de caldo en 200 ml de agua caliente y agregar a la olla.
7. Cocinar a fuego bajo con tapa 30 minutos, removiendo ocasionalmente.
8. Ajustar sal. Si queda muy líquido, cocinar 10 min más sin tapa.

TIPS PARA EL NIÑO: Servir con arroz blanco o puré de papa para una versión más suave. Evitar agregar cualquier picante.

PARA CONGELAR: Excelente para congelar. Enfriar, porcionar y guardar hasta 4 meses.

PARA RECALENTAR: En sartén o microondas. Agregar un poco de agua si quedó muy espeso.`,
    ingredients: [
      { name: 'Carne molida de res magra', grams: 700 },
      { name: 'Porotos rojos cocidos', grams: 600 },
      { name: 'Tomate triturado en lata', grams: 800 },
      { name: 'Cebolla', grams: 200, notes: 'picada' },
      { name: 'Pimiento rojo', grams: 200, notes: 'en cubos pequeños' },
      { name: 'Ajo', grams: 15, notes: 'picado' },
      { name: 'Aceite de oliva', grams: 30 },
      { name: 'Comino molido', grams: 10 },
      { name: 'Pimentón dulce', grams: 8 },
      { name: 'Concentrado de tomate', grams: 40 },
      { name: 'Caldo de pollo (pastilla)', grams: 10 },
      { name: 'Sal', grams: 8 },
    ],
  },

  // ──────────────────────────────────────────
  // 8. Pollo al limón con batata asada
  // ──────────────────────────────────────────
  {
    name: 'Pollo al limón con batata asada',
    servings: 6,
    description: `Pechuga de pollo marinada en limón y hierbas, horneada junto con batata. Receta simple, nutritiva y con sabor fresco. Las batatas aportan un toque dulce que encanta a los niños.

PREPARACIÓN:
1. Mezclar en bowl: el jugo de limón, el ajo picado, el orégano, el tomillo, el aceite de oliva, sal y pimienta.
2. Cortar el pollo en filetes o porciones. Marinar en la mezcla al menos 30 minutos (ideal 2 horas en heladera).
3. Pelar y cortar las batatas en cubos de 3 cm. Condimentar con un poco del marinado, sal y aceite.
4. Precalentar horno a 200°C.
5. Distribuir las batatas en una bandeja y hornear 15 minutos.
6. Agregar el pollo marinado sobre las batatas.
7. Hornear 25-30 minutos más hasta que el pollo esté dorado y las batatas tiernas.
8. Rociar con el jugo de cocción antes de servir.

PARA CONGELAR: Enfriar completamente. Porcionar en recipientes separando pollo y batata. Conserva hasta 2 meses (la batata cambia un poco de textura al descongelar).

PARA RECALENTAR: Horno a 180°C por 15-20 min, o microondas 4-5 min.`,
    ingredients: [
      { name: 'Pechuga de pollo', grams: 700, notes: 'en filetes o porciones' },
      { name: 'Batata', grams: 800, notes: 'en cubos de 3 cm' },
      { name: 'Limón', grams: 120, notes: 'jugo de 2 limones' },
      { name: 'Ajo', grams: 20, notes: 'picado o en pasta' },
      { name: 'Aceite de oliva', grams: 50 },
      { name: 'Orégano seco', grams: 6 },
      { name: 'Tomillo seco', grams: 4 },
      { name: 'Sal', grams: 10 },
      { name: 'Pimienta negra', grams: 3 },
    ],
  },

  // ──────────────────────────────────────────
  // 9. Pastel de carne con puré de papa
  // ──────────────────────────────────────────
  {
    name: 'Pastel de carne con puré de papa',
    servings: 6,
    description: `Clásico pastel de carne cubierto con puré de papa cremoso y gratinado. Plato completo, nutritivo y que a los niños les encanta. Ideal para preparar en cantidad.

PREPARACIÓN:
1. Cocinar las papas en agua con sal hasta tiernas. Escurrir y hacer puré con manteca, leche, sal, pimienta y nuez moscada (opcional). Reservar.
2. En sartén, calentar el aceite y sofreír la cebolla y el ajo hasta transparentes.
3. Agregar la zanahoria picada fina y los champiñones laminados. Cocinar 5 min.
4. Incorporar la carne molida y dorar completamente, desmenuzando bien.
5. Añadir el tomate triturado, el tomillo, sal y pimienta. Cocinar 10 min.
6. Precalentar horno a 200°C. Engrasar una fuente para horno.
7. Distribuir la carne en la base. Cubrir con el puré de papa. Espolvorear queso rallado.
8. Hornear 25-30 min hasta que el puré esté dorado.

TIPS PARA EL NIÑO: El puré suave y la carne bien molida lo hacen muy fácil de comer para los más pequeños.

PARA CONGELAR: Cortar en porciones cuando esté frío. Envolver individualmente. Conserva hasta 3 meses.

PARA RECALENTAR: Horno a 180°C por 20-25 min con papel aluminio. Los últimos 5 min destapar para que el puré quede dorado.`,
    ingredients: [
      { name: 'Carne molida de res magra', grams: 600 },
      { name: 'Papa', grams: 900, notes: 'para el puré' },
      { name: 'Cebolla', grams: 200, notes: 'picada fina' },
      { name: 'Zanahoria', grams: 150, notes: 'picada fina' },
      { name: 'Champiñones', grams: 200, notes: 'laminados' },
      { name: 'Tomate triturado en lata', grams: 200 },
      { name: 'Ajo', grams: 10, notes: 'picado' },
      { name: 'Aceite de oliva', grams: 30 },
      { name: 'Manteca', grams: 50, notes: 'para el puré' },
      { name: 'Leche entera', grams: 100, notes: 'para el puré' },
      { name: 'Queso rallado', grams: 60, notes: 'para gratinar' },
      { name: 'Tomillo seco', grams: 4 },
      { name: 'Sal', grams: 10 },
      { name: 'Pimienta negra', grams: 4 },
    ],
  },

  // ──────────────────────────────────────────
  // 10. Crema de zapallo con cúrcuma
  // ──────────────────────────────────────────
  {
    name: 'Crema de zapallo con cúrcuma',
    servings: 6,
    description: `Crema aterciopelada de zapallo con cúrcuma y un toque de crema. Antiinflamatoria, rica en vitaminas y con un color dorado precioso. Los niños suelen adorar su sabor dulce y suave.

PREPARACIÓN:
1. Pelar el zapallo y cortarlo en cubos grandes. Hacer lo mismo con la papa y la zanahoria.
2. En una olla grande, calentar el aceite y sofreír la cebolla y el ajo hasta transparentes.
3. Agregar la cúrcuma y revolver 30 segundos para que se active.
4. Incorporar el zapallo, la zanahoria y la papa. Revolver para cubrir con la cúrcuma.
5. Agregar la pastilla de caldo disuelta en 1 litro de agua caliente.
6. Cocinar a fuego bajo-medio 25-30 min hasta que todas las verduras estén tiernas.
7. Mixear con procesadora o mixer de mano hasta lograr una crema suave.
8. Agregar la crema de leche. Ajustar sal, pimienta y nuez moscada. Calentar 5 min más.
9. Servir con un hilo de crema y pan tostado.

TIPS PARA EL NIÑO: Es perfecta tal cual. Se puede omitir la pimienta para hacerla más suave.

PARA CONGELAR: Excelente para congelar. Dividir en porciones, enfriar y congelar hasta 4 meses.

PARA RECALENTAR: En olla a fuego bajo, revolviendo. Agregar un poco de agua o caldo si espesó demasiado.`,
    ingredients: [
      { name: 'Zapallo', grams: 1200, notes: 'pelado y en cubos' },
      { name: 'Cebolla', grams: 200, notes: 'picada' },
      { name: 'Zanahoria', grams: 200, notes: 'en cubos' },
      { name: 'Papa', grams: 200, notes: 'en cubos' },
      { name: 'Ajo', grams: 15, notes: 'picado' },
      { name: 'Aceite de oliva', grams: 40 },
      { name: 'Crema de leche', grams: 150 },
      { name: 'Caldo de verduras (pastilla)', grams: 15 },
      { name: 'Cúrcuma', grams: 5 },
      { name: 'Nuez moscada', grams: 3 },
      { name: 'Sal', grams: 10 },
      { name: 'Pimienta negra', grams: 3 },
    ],
  },

  // ──────────────────────────────────────────
  // 11. Arroz con pollo al estilo casero
  // ──────────────────────────────────────────
  {
    name: 'Arroz con pollo al estilo casero',
    servings: 6,
    description: `Clásico arroz con pollo con verduras, al estilo casero. Plato completo, económico y muy fácil de preparar en cantidad. El arroz absorbe todos los sabores del pollo y las verduras.

PREPARACIÓN:
1. Cortar el pollo en trozos medianos. Salpimentar.
2. En una olla grande o cazuela, calentar el aceite a fuego alto. Dorar el pollo por todos los lados. Retirar y reservar.
3. En el mismo recipiente, sofreír la cebolla y el pimiento rojo hasta ablandar.
4. Agregar el ajo, el pimentón dulce y la cúrcuma. Cocinar 1 minuto.
5. Incorporar la zanahoria en rodajas y el tomate triturado. Revolver.
6. Volver a poner el pollo. Disolver la pastilla de caldo en 900 ml de agua y agregar.
7. Cuando hierva, añadir el arroz lavado. Revolver, tapar y cocinar a fuego bajo 20 min.
8. Apagar, dejar reposar tapado 5 min. Decorar con perejil fresco.

TIPS PARA EL NIÑO: Deshuesar el pollo antes de servir para que el niño pueda comer sin peligro.

PARA CONGELAR: El arroz con pollo se puede congelar aunque el arroz cambia un poco de textura. Conserva hasta 2 meses.

PARA RECALENTAR: En microondas o sartén con un poco de agua o caldo para recuperar la humedad.`,
    ingredients: [
      { name: 'Pechuga de pollo', grams: 700, notes: 'en trozos medianos' },
      { name: 'Arroz blanco', grams: 500, notes: 'lavado' },
      { name: 'Cebolla', grams: 200, notes: 'picada' },
      { name: 'Pimiento rojo', grams: 200, notes: 'en cubos' },
      { name: 'Zanahoria', grams: 200, notes: 'en rodajas' },
      { name: 'Tomate triturado en lata', grams: 400 },
      { name: 'Ajo', grams: 15, notes: 'picado' },
      { name: 'Aceite de oliva', grams: 40 },
      { name: 'Caldo de pollo (pastilla)', grams: 15 },
      { name: 'Pimentón dulce', grams: 8 },
      { name: 'Cúrcuma', grams: 5, notes: 'para color dorado' },
      { name: 'Perejil fresco', grams: 20, notes: 'para decorar' },
      { name: 'Sal', grams: 10 },
    ],
  },

  // ──────────────────────────────────────────
  // 12. Carne a la provenzal
  // ──────────────────────────────────────────
  {
    name: 'Carne a la provenzal',
    servings: 6,
    description: `Guiso de carne de res estilo provenzal, con tomates frescos, aceitunas y vino blanco. Sabor mediterráneo intenso y muy aromático. Perfecto servido con arroz o papas cocidas.

PREPARACIÓN:
1. Cortar la carne en cubos de 4 cm. Salpimentar.
2. En una olla de fondo grueso o cacerola, calentar el aceite a fuego alto. Sellar la carne en tandas hasta dorar bien. Retirar y reservar.
3. En el mismo recipiente, sofreír la cebolla picada hasta transparente.
4. Agregar el ajo picado, el orégano y el tomillo. Cocinar 1 minuto.
5. Verter el vino blanco y dejar evaporar el alcohol 2 minutos a fuego alto.
6. Incorporar los tomates frescos en cubos y el tomate triturado. Revolver.
7. Volver a poner la carne. Añadir el laurel y las aceitunas.
8. Tapar y cocinar a fuego bajo 1 hora hasta que la carne esté muy tierna.
9. Ajustar sal y retirar el laurel.

PARA CONGELAR: Excelente para congelar, los sabores se intensifican. Conserva hasta 3 meses.

PARA RECALENTAR: En olla a fuego bajo con tapa, agregando un poco de agua si es necesario.`,
    ingredients: [
      { name: 'Carne de res en cubos', grams: 700 },
      { name: 'Tomate fresco', grams: 400, notes: 'en cubos' },
      { name: 'Tomate triturado en lata', grams: 300 },
      { name: 'Aceitunas verdes', grams: 100, notes: 'sin carozo' },
      { name: 'Cebolla', grams: 200, notes: 'picada' },
      { name: 'Ajo', grams: 20, notes: 'picado' },
      { name: 'Aceite de oliva', grams: 40 },
      { name: 'Vino blanco', grams: 150 },
      { name: 'Orégano seco', grams: 8 },
      { name: 'Tomillo seco', grams: 5 },
      { name: 'Laurel', grams: 3, notes: '2 hojas' },
      { name: 'Sal', grams: 10 },
      { name: 'Pimienta negra', grams: 3 },
    ],
  },

  // ──────────────────────────────────────────
  // 13. Cazuela de pollo con champiñones y crema
  // ──────────────────────────────────────────
  {
    name: 'Cazuela de pollo con champiñones y crema',
    servings: 6,
    description: `Cazuela cremosa de pollo con champiñones y puerro. Suave, reconfortante y muy sabrosa. La mostaza le da un toque especial sin ser picante.

PREPARACIÓN:
1. Cortar el pollo en trozos o filetes. Salpimentar.
2. En una cazuela grande, calentar el aceite y dorar el pollo por ambos lados. Retirar.
3. En el mismo recipiente, sofreír la cebolla y el puerro (parte blanca y verde claro) picados hasta ablandar.
4. Agregar el ajo y el tomillo. Cocinar 1 minuto.
5. Incorporar los champiñones laminados. Cocinar a fuego alto hasta que suelten su agua y esta se evapore.
6. Disolver la pastilla de caldo en 200 ml de agua caliente y agregar a la cazuela.
7. Volver a poner el pollo. Tapar y cocinar 20 minutos a fuego bajo.
8. Agregar la crema de leche y la mostaza. Mezclar suavemente y cocinar 5 min sin tapa.
9. Ajustar sal y pimienta.

TIPS PARA EL NIÑO: La salsa cremosa es deliciosa con pasta corta o arroz blanco.

PARA CONGELAR: Enfriar y porcionar. Conserva hasta 2 meses (la crema puede separarse un poco al descongelar, revolver al calentar).

PARA RECALENTAR: En sartén a fuego bajo, revolviendo suave. Si la salsa se cortó, agregar una cucharada de leche y revolver.`,
    ingredients: [
      { name: 'Pechuga de pollo', grams: 750, notes: 'en trozos o filetes' },
      { name: 'Champiñones', grams: 500, notes: 'laminados' },
      { name: 'Cebolla', grams: 200, notes: 'picada' },
      { name: 'Puerro', grams: 200, notes: 'picado fino' },
      { name: 'Crema de leche', grams: 200 },
      { name: 'Caldo de pollo (pastilla)', grams: 10 },
      { name: 'Ajo', grams: 15, notes: 'picado' },
      { name: 'Aceite de oliva', grams: 40 },
      { name: 'Mostaza', grams: 20 },
      { name: 'Tomillo seco', grams: 5 },
      { name: 'Sal', grams: 8 },
      { name: 'Pimienta negra', grams: 3 },
    ],
  },

  // ──────────────────────────────────────────
  // 14. Minestrone con legumbres y pasta
  // ──────────────────────────────────────────
  {
    name: 'Minestrone con legumbres y pasta',
    servings: 6,
    description: `Sopa italiana abundante con verduras de temporada, garbanzos y pasta. Vegetariana, altamente nutritiva y reconfortante. Una de las mejores opciones para congelar.

PREPARACIÓN:
1. En una olla grande, calentar el aceite y sofreír la cebolla y el puerro picados.
2. Agregar el ajo, la zanahoria en cubos, el apio en rodajas y la papa en cubos pequeños. Rehogar 5 minutos.
3. Añadir el tomate fresco picado y el tomate triturado. Cocinar 3 minutos.
4. Disolver la pastilla de caldo en 1.5 litros de agua caliente y agregar.
5. Incorporar los garbanzos cocidos.
6. Cocinar a fuego bajo 20 minutos.
7. Agregar el zapallo en cubos pequeños y cocinar 10 minutos más.
8. Incorporar la pasta y cocinar según tiempo de cocción del paquete.
9. Agregar el orégano, el perejil y ajustar sal.

NOTA: Si se va a congelar, es mejor no agregar la pasta. Agregarla fresca al recalentar.

PARA CONGELAR: Congelar sin la pasta. Conserva hasta 4 meses. Cocinar la pasta fresca al momento de servir.

PARA RECALENTAR: Calentar en olla, hervir, agregar la pasta y cocinar hasta que esté lista.`,
    ingredients: [
      { name: 'Pasta seca', grams: 250, notes: 'agregar al recalentar si se va a congelar' },
      { name: 'Garbanzos cocidos', grams: 300 },
      { name: 'Zanahoria', grams: 300, notes: 'en cubos pequeños' },
      { name: 'Apio', grams: 200, notes: 'en rodajas' },
      { name: 'Papa', grams: 300, notes: 'en cubos pequeños' },
      { name: 'Cebolla', grams: 200, notes: 'picada' },
      { name: 'Puerro', grams: 150, notes: 'picado' },
      { name: 'Tomate fresco', grams: 200, notes: 'en cubos' },
      { name: 'Tomate triturado en lata', grams: 400 },
      { name: 'Zapallo', grams: 200, notes: 'en cubos pequeños' },
      { name: 'Aceite de oliva', grams: 30 },
      { name: 'Caldo de verduras (pastilla)', grams: 20 },
      { name: 'Ajo', grams: 15, notes: 'picado' },
      { name: 'Orégano seco', grams: 5 },
      { name: 'Perejil fresco', grams: 20, notes: 'picado' },
      { name: 'Sal', grams: 10 },
    ],
  },

  // ──────────────────────────────────────────
  // 15. Merluza al horno con verduras mediterráneas
  // ──────────────────────────────────────────
  {
    name: 'Merluza al horno con verduras mediterráneas',
    servings: 6,
    description: `Filetes de merluza al horno sobre cama de verduras mediterráneas con aceitunas y limón. Ligero, nutritivo y muy fácil de preparar. El pescado es excelente fuente de proteína para toda la familia.

PREPARACIÓN:
1. Precalentar horno a 200°C.
2. Cortar la cebolla en plumas, el pimiento en tiras y el tomate fresco en rodajas.
3. En una fuente para horno amplia, disponer las verduras. Rociar con aceite, salar y mezclar.
4. Hornear las verduras 15 minutos.
5. Colocar los filetes de merluza sobre las verduras.
6. Mezclar el ajo picado, el jugo de limón, el orégano, sal y pimienta con 2 cucharadas de aceite. Verter sobre el pescado.
7. Distribuir las aceitunas y espolvorear pan rallado.
8. Hornear 20-25 min hasta que el pescado esté opaco y el pan rallado dorado.

TIPS PARA EL NIÑO: El pan rallado le da una textura crujiente que les encanta a los niños. Quitar las aceitunas de su porción si no le gustan.

PARA CONGELAR: El pescado se puede congelar cocinado hasta 1 mes. Enfriar completamente antes de congelar.

PARA RECALENTAR: Horno a 170°C por 15 min tapado con papel aluminio para no resecar el pescado.`,
    ingredients: [
      { name: 'Filete de merluza', grams: 900 },
      { name: 'Tomate fresco', grams: 400, notes: 'en rodajas' },
      { name: 'Cebolla', grams: 200, notes: 'en plumas' },
      { name: 'Pimiento rojo', grams: 200, notes: 'en tiras' },
      { name: 'Aceitunas verdes', grams: 80, notes: 'sin carozo' },
      { name: 'Ajo', grams: 15, notes: 'picado' },
      { name: 'Aceite de oliva', grams: 50 },
      { name: 'Limón', grams: 80, notes: 'jugo' },
      { name: 'Pan rallado', grams: 40 },
      { name: 'Orégano seco', grams: 6 },
      { name: 'Sal', grams: 8 },
      { name: 'Pimienta negra', grams: 3 },
    ],
  },

  // ──────────────────────────────────────────
  // 16. Tarta de espinacas y ricota
  // ──────────────────────────────────────────
  {
    name: 'Tarta de espinacas y ricota',
    servings: 6,
    description: `Tarta casera con masa crocante y relleno cremoso de espinacas, ricota y queso. Excelente fuente de calcio y hierro. Se puede comer fría o caliente. Ideal para llevar al trabajo o al jardín.

PREPARACIÓN:
MASA: Mezclar la harina con la manteca fría en cubos con los dedos hasta obtener textura arenosa. Agregar la leche fría de a poco hasta que la masa cohesione. Envolver y reposar en heladera 30 min.

RELLENO:
1. Hervir las espinacas 2 min, escurrir muy bien (exprimir el agua) y picar.
2. Sofreír la cebolla y el ajo en aceite hasta transparentes. Enfriar.
3. Mezclar las espinacas, la ricota, 3 huevos batidos, la cebolla sofrita, el queso rallado, sal, pimienta y nuez moscada.

ARMADO:
4. Estirar la masa y forrar un molde enmantecado de 28-30 cm.
5. Volcar el relleno. Batir el huevo restante y pintar los bordes.
6. Hornear a 180°C durante 35-40 min hasta que la tarta esté firme y dorada.

PARA CONGELAR: Cortar en porciones. Envolver en film y papel aluminio. Conserva hasta 2 meses.

PARA RECALENTAR: Horno a 170°C por 15-20 min, o microondas 3-4 min.`,
    ingredients: [
      { name: 'Espinacas', grams: 500, notes: 'hervidas y bien escurridas' },
      { name: 'Ricota', grams: 400 },
      { name: 'Huevo entero', grams: 220, notes: '4 huevos' },
      { name: 'Cebolla', grams: 150, notes: 'picada fina' },
      { name: 'Queso rallado', grams: 100 },
      { name: 'Ajo', grams: 10, notes: 'picado' },
      { name: 'Aceite de oliva', grams: 30 },
      { name: 'Nuez moscada', grams: 3 },
      { name: 'Harina de trigo', grams: 200, notes: 'para la masa' },
      { name: 'Manteca', grams: 80, notes: 'fría, para la masa' },
      { name: 'Leche entera', grams: 60, notes: 'fría, para la masa' },
      { name: 'Sal', grams: 8 },
      { name: 'Pimienta negra', grams: 3 },
    ],
  },

  // ──────────────────────────────────────────
  // 17. Croquetas de pollo horneadas
  // ──────────────────────────────────────────
  {
    name: 'Croquetas de pollo horneadas',
    servings: 6,
    description: `Croquetas de pollo y papa horneadas, doradas y crujientes sin freír. Perfectas para los niños: fáciles de agarrar, sabrosas y nutritivas. Se congelan crudas o cocidas.

PREPARACIÓN:
1. Cocinar las papas con piel en agua con sal hasta tiernas. Pelar y hacer puré fino. Enfriar.
2. Cocinar el pollo en agua con sal, ajo y perejil 20 min. Escurrir, desmenuzar bien y enfriar.
3. Mezclar el puré de papa, el pollo desmenuzado, 1 huevo, el queso rallado, el ajo picado, el perejil, sal y pimienta.
4. Formar croquetas ovaladas de 6-8 cm.
5. Pasar por harina (opcional), luego por huevo batido y finalmente por pan rallado. Presionar bien.
6. Disponer en bandeja con papel manteca. Rociar con aceite de oliva.
7. Hornear a 220°C por 20-25 min, dando vuelta a mitad para dorar por ambos lados.

TIPS PARA EL NIÑO: Hacer croquetas más pequeñas tipo dedos para que sean divertidas de comer.

PARA CONGELAR: Se pueden congelar crudas (antes de hornear) o cocidas. Conserva hasta 3 meses. Para las crudas: hornear directamente del freezer 30 min a 200°C.

PARA RECALENTAR: Horno a 180°C por 15 min para que queden crujientes. El microondas las ablanda.`,
    ingredients: [
      { name: 'Pechuga de pollo', grams: 600, notes: 'cocida y desmenuzada' },
      { name: 'Papa', grams: 500, notes: 'cocida y en puré' },
      { name: 'Huevo entero', grams: 165, notes: '3 huevos (1 para mezcla, 2 para empanizar)' },
      { name: 'Pan rallado', grams: 150, notes: 'para empanizar' },
      { name: 'Ajo', grams: 10, notes: 'picado fino' },
      { name: 'Perejil fresco', grams: 20, notes: 'picado fino' },
      { name: 'Queso rallado', grams: 60 },
      { name: 'Aceite de oliva', grams: 30, notes: 'para rociar antes de hornear' },
      { name: 'Sal', grams: 8 },
      { name: 'Pimienta negra', grams: 3 },
    ],
  },

  // ──────────────────────────────────────────
  // 18. Pollo salteado con brócoli y arroz integral
  // ──────────────────────────────────────────
  {
    name: 'Pollo salteado con brócoli y arroz integral',
    servings: 6,
    description: `Salteado estilo oriental de pollo con brócoli y zanahoria, servido con arroz integral. Ligero, alto en proteínas y muy colorido. La maicena da una salsa brillante y apetecible.

PREPARACIÓN:
1. Cocinar el arroz integral según instrucciones (aprox. 40 min en agua con sal).
2. Cortar el pollo en cubos o tiras finas. Marinar 15 min con la mitad de la salsa de soja y la maicena.
3. Dividir el brócoli en flores pequeñas. Blanquear en agua hirviendo 2 min, escurrir y reservar.
4. Calentar a fuego muy alto el aceite de oliva y el aceite de sésamo en wok o sartén grande.
5. Saltear el pollo en tandas hasta dorar. Retirar.
6. En el mismo wok, saltear el ajo y el jengibre rallados 30 seg.
7. Agregar la zanahoria en juliana. Saltear 3 min.
8. Incorporar el brócoli y el pollo. Verter el resto de la salsa de soja.
9. Revolver todo 2-3 minutos a fuego alto.
10. Servir sobre el arroz integral.

TIPS PARA EL NIÑO: El brócoli en flores pequeñas es fácil de comer. Reducir la salsa de soja si es muy salada para el niño.

PARA CONGELAR: Congelar el salteado y el arroz por separado. Conserva hasta 2 meses.

PARA RECALENTAR: En sartén a fuego medio con un chorrito de agua. El arroz en microondas con vapor.`,
    ingredients: [
      { name: 'Pechuga de pollo', grams: 700, notes: 'en cubos o tiras' },
      { name: 'Brócoli', grams: 600, notes: 'en flores' },
      { name: 'Zanahoria', grams: 200, notes: 'en juliana' },
      { name: 'Arroz integral', grams: 450 },
      { name: 'Salsa de soja', grams: 80 },
      { name: 'Aceite de sésamo', grams: 20 },
      { name: 'Aceite de oliva', grams: 20 },
      { name: 'Ajo', grams: 15, notes: 'rallado' },
      { name: 'Jengibre fresco', grams: 15, notes: 'rallado' },
      { name: 'Maicena', grams: 20, notes: 'para marinar el pollo' },
      { name: 'Sal', grams: 5 },
      { name: 'Pimienta negra', grams: 3 },
    ],
  },

  // ──────────────────────────────────────────
  // 19. Berenjenas rellenas de carne
  // ──────────────────────────────────────────
  {
    name: 'Berenjenas rellenas de carne',
    servings: 6,
    description: `Berenjenas rellenas con carne de res, tomate y verduras, gratinadas con queso. Plato completo, bajo en carbohidratos y muy sabroso. Perfecto para congelar en porciones individuales.

PREPARACIÓN:
1. Cortar las berenjenas al medio a lo largo. Hacer cortes en la pulpa en forma de cuadrícula sin romper la piel.
2. Salar las mitades y dejar reposar 20 min para eliminar el amargor. Secar con papel.
3. Untar con aceite y hornear a 200°C por 20 min hasta que la pulpa esté tierna.
4. Retirar la pulpa con cuchara, dejando 1 cm de borde. Picar la pulpa y reservar.
5. Sofreír la cebolla, el ajo y el pimiento rojo picados en aceite hasta ablandar.
6. Agregar la carne molida y dorar completamente.
7. Incorporar la pulpa de berenjena, el tomate fresco en cubos, el tomate triturado, el orégano, sal y pimienta. Cocinar 10 min.
8. Rellenar las mitades de berenjena con la mezcla de carne.
9. Espolvorear queso rallado y hornear 15-20 min hasta gratinar.

PARA CONGELAR: Dejar enfriar completamente. Envolver cada mitad en papel aluminio. Conserva hasta 2 meses.

PARA RECALENTAR: Horno a 180°C por 20-25 min tapadas con papel aluminio.`,
    ingredients: [
      { name: 'Berenjena', grams: 1200, notes: '6 berenjenas medianas, partidas al medio' },
      { name: 'Carne molida de res magra', grams: 400 },
      { name: 'Tomate fresco', grams: 300, notes: 'en cubos' },
      { name: 'Cebolla', grams: 150, notes: 'picada' },
      { name: 'Ajo', grams: 15, notes: 'picado' },
      { name: 'Pimiento rojo', grams: 150, notes: 'en cubos pequeños' },
      { name: 'Tomate triturado en lata', grams: 200 },
      { name: 'Aceite de oliva', grams: 40 },
      { name: 'Orégano seco', grams: 5 },
      { name: 'Queso rallado', grams: 100, notes: 'para gratinar' },
      { name: 'Sal', grams: 8 },
      { name: 'Pimienta negra', grams: 3 },
    ],
  },

  // ──────────────────────────────────────────
  // 20. Sopa de pollo con fideos
  // ──────────────────────────────────────────
  {
    name: 'Sopa de pollo con fideos',
    servings: 6,
    description: `La clásica sopa de pollo con fideos, cargada de verduras y aroma a hierbas. Reconfortante, digestiva y perfecta para toda la familia. Una de las recetas más amigables para freezer.

PREPARACIÓN:
1. En una olla grande, calentar el aceite y sofreír la cebolla, el puerro y el ajo picados hasta transparentes.
2. Agregar la zanahoria en rodajas y el apio en rodajas. Rehogar 3 minutos.
3. Incorporar las pechugas de pollo enteras o en mitades.
4. Disolver la pastilla de caldo en 2 litros de agua caliente. Verter en la olla.
5. Agregar el laurel, la cúrcuma y salpimentar.
6. Cocinar a fuego bajo 30 minutos. Retirar el pollo, dejar enfriar y desmenuzar.
7. Volver el pollo desmenuzado a la olla. Verificar y ajustar sal.
8. Agregar la pasta y cocinar según instrucciones. Retirar el laurel.
9. Servir con perejil fresco picado.

NOTA: Si se va a congelar, no agregar la pasta. Agregarla fresca al recalentar.

TIPS PARA EL NIÑO: Esta sopa es ideal cuando el niño está con poco apetito o resfriado. El pollo desmenuzado es fácil de comer.

PARA CONGELAR: Congelar sin los fideos. Conserva hasta 4 meses.

PARA RECALENTAR: Calentar en olla, hervir, agregar los fideos y cocinar 8-10 minutos.`,
    ingredients: [
      { name: 'Pechuga de pollo', grams: 600, notes: 'entera, se desmenuzará después de cocinar' },
      {
        name: 'Pasta seca',
        grams: 200,
        notes: 'fideos finos, agregar al recalentar si se congela',
      },
      { name: 'Zanahoria', grams: 300, notes: 'en rodajas' },
      { name: 'Apio', grams: 200, notes: 'en rodajas' },
      { name: 'Cebolla', grams: 200, notes: 'picada' },
      { name: 'Puerro', grams: 150, notes: 'picado fino' },
      { name: 'Ajo', grams: 10, notes: 'picado' },
      { name: 'Aceite de oliva', grams: 30 },
      { name: 'Caldo de pollo (pastilla)', grams: 20 },
      { name: 'Laurel', grams: 3, notes: '2 hojas' },
      { name: 'Cúrcuma', grams: 5, notes: 'para color dorado y propiedades antiinflamatorias' },
      { name: 'Perejil fresco', grams: 20, notes: 'para servir' },
      { name: 'Sal', grams: 8 },
      { name: 'Pimienta negra', grams: 3 },
    ],
  },
];

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  console.log('Iniciando seed de nutricion: 20 recetas saludables para congelador...\n');

  // 1. Obtener primer usuario
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!user) {
    throw new Error('No se encontro ningun usuario. Crea un usuario primero.');
  }

  console.log(`Usuario: ${user.email} (${user.id})\n`);

  // 2. Crear alimentos (upsert para no duplicar)
  console.log(`Creando ${foodsData.length} alimentos...`);

  const foods: Record<string, { id: string }> = {};

  for (const fd of foodsData) {
    const food = await prisma.food.upsert({
      where: { userId_name: { userId: user.id, name: fd.name } },
      update: {},
      create: {
        userId: user.id,
        name: fd.name,
        calories: fd.calories,
        protein: fd.protein,
        carbs: fd.carbs,
        fat: fd.fat,
        fiber: fd.fiber,
        unit: fd.unit,
        isActive: true,
      },
    });
    foods[fd.name] = food;
  }

  console.log(`  OK: ${foodsData.length} alimentos listos.\n`);

  // 3. Crear recetas con ingredientes
  console.log(`Creando ${recipesData.length} recetas...\n`);

  let recipeCount = 0;
  let ingredientCount = 0;

  for (const rd of recipesData) {
    // Verificar que todos los ingredientes de la receta existen en el mapa
    const missing = rd.ingredients.filter((ing) => !foods[ing.name]);
    if (missing.length > 0) {
      console.error(
        `  ERROR en "${rd.name}": ingredientes no encontrados: ${missing.map((m) => m.name).join(', ')}`
      );
      continue;
    }

    // Crear la receta
    const recipe = await prisma.recipe.create({
      data: {
        userId: user.id,
        name: rd.name,
        description: rd.description,
        servings: rd.servings,
        isActive: true,
      },
    });

    // Agregar ingredientes
    for (const ing of rd.ingredients) {
      await prisma.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          foodId: foods[ing.name].id,
          grams: ing.grams,
          notes: ing.notes ?? null,
        },
      });
      ingredientCount++;
    }

    recipeCount++;
    console.log(`  [${recipeCount}/20] ${rd.name} — ${rd.ingredients.length} ingredientes`);
  }

  console.log(`\nSeed completado exitosamente!`);
  console.log(`  Alimentos creados/verificados: ${foodsData.length}`);
  console.log(`  Recetas creadas: ${recipeCount}`);
  console.log(`  Ingredientes registrados: ${ingredientCount}`);
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
