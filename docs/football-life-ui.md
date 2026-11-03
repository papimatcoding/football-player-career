# Football Life Simulator — Interfaz V1

## Referencia visual
Diseño aprobado en Canva: https://www.canva.com/d/y8eOzebC0ri6WTT

## Alcance de esta PR
- Nuevo nombre visible y título de la pestaña: **Football Life Simulator**.
- Paleta azul noche, verde esmeralda reservado para acciones y estados positivos, componentes sobrios y navegación con iconos SVG.
- Inicio: próxima jornada destacada mediante los equipos reales del calendario, CTA conectado a `Game.openPhase`, estadísticas de temporada y noticia real de `S.inbox`.
- Club actual y previa de partido con escudos SVG reales (cuando el fichero esté disponible); banderas SVG del país del club; identificadores alternativos si no se carga el escudo.
- Perfil: identidad visual de club y país sin inventar una nacionalidad del jugador.
- Resultado: escudos integrados en el marcador que ya existía; no se crea un marcador duplicado.
- Móvil: ajuste de barras, tarjetas y navegación.

## Arquitectura y compatibilidad
La capa visual reside en `assets/js/fls-ui.js` y `assets/css/fls-ui.css`, cargados **después** del motor y los estilos actuales.
`fls-ui.js` envuelve la función global `render()` para decorar el DOM generado, sin modificar `S`, sus reglas de negocio, los métodos de `Game` ni la persistencia.

La clave **`fuera_de_guion_carrera_v4`** se mantiene deliberadamente para conservar partidas antiguas. No cambiarla en un parche visual. No borrar los scripts históricos de partido. No tocar `match-simulator`: continúa como laboratorio independiente hasta estabilizar el motor y definir su integración.

## Escudos y banderas
- Clubes españoles: SVG públicos del repositorio `JoseArroyave/football-logos`, con un mapa explícito para evitar nombres de fichero adivinados.
- Banderas: recursos SVG de `flagcdn.com`, según el país real del club.
- Los assets se cargan de Internet. **El juego sigue siendo jugable offline** pero se muestran iniciales del equipo y se omite la bandera si los recursos no están disponibles. Los datos de carrera nunca dependen de imágenes externas.
- No se asume que la nacionalidad de un futbolista sea la misma que el país de su club.

## QA previo al merge (pendiente de validación visual en navegador)
1. Abrir un usuario nuevo: nombre del juego actualizado, creación y tres ofertas de cantera funcionales.
2. Importar o reanudar una partida existente: mismo jugador, equipo y semana; exportar JSON.
3. En Inicio: comprobar escudos locales/visitantes, CTA a la fase real (sin saltarse entrenamiento/vida).
4. Recorrer Entreno, Vida y Partido; empezar partido y terminarlo; comprobar que el motor V10 sigue intacto.
5. Resultado: marcador único, estadísticas y botón de siguiente jornada.
6. Cambiar de club y revisar perfil, escudo y país; probar un club extranjero (fallback).
7. Probar 1920px, 1366px, 768px y 375px: navegación legible, sin scroll horizontal.
8. Desconectar Internet y verificar que los iconos no impiden jugar.

## Siguiente iteración (no incluida)
- Mejorar la maquetación específica de perfil y progresión, vinculando desbloqueos a sistemas de juego reales (no botones ficticios).
- Incorporar escudos y banderas en tablas, mercado e historial, y normalizar un catálogo de assets local/cacheable.
- Integrar MatchLab mediante un adaptador con pruebas de resultados y persistencia; esta PR no realiza esa integración.


## UI V2 · Escudos prioritarios (3 noviembre 2026)

Esta segunda fase amplía el diseño aprobado de Canva a las pantallas de cantera, perfil, mercado, clasificación, historial y retransmisión en directo. Se mantienen todos los estados, botones y datos del motor antiguo: el parche solo decora el DOM después del render.

- **Catálogo contrastado:** `assets/js/fls-crest-catalog.js` asigna archivos SVG existentes a **438 de los 482 clubes profesionales** de `LEAGUES` (**90,9 %**). Es un mapa de rutas verificadas, no una estimación por similitud de nombres.
- **Canteras Sub-19:** reutilizan el escudo del club matriz; el nombre del equipo juvenil sigue siendo distinto en calendarios y resultados.
- **Clubes sin SVG disponible:** se sustituyen por iniciales; nunca se muestra un escudo de otro equipo como solución automática.
- **Cantera:** tres propuestas con escudos y banderas; `Game.join` se conserva.
- **Liga:** escudos discretos en cada fila, también para las ligas juveniles.
- **Ojeadores y mercado:** identidad visual de cada club, respetando requisitos, selección de oferta y contratos del motor.
- **Trayectoria:** escudos históricos, conservando temporadas y estadísticas.
- **Partido:** escudos en la previa y en la retransmisión 2D real; no se sustituye ni altera el motor de partido.
- **Perfil:** composición limpia con la nacionalidad del jugador diferenciada del país del club.

**Limitaciones intencionadas:** SVG alojados remotamente; sin conexión se muestra la reserva de iniciales. No se ha implementado descarga/localización masiva de los assets, por lo que disponer de los recursos no es un requisito para seguir jugando. Algunos clubes están pendientes de verificar.

**Pruebas:** `tests/fls-ui-smoke.mjs`, ejecutado en Chromium por el workflow `fls-ui.yml`. Comprobar siempre los flujos desde creación y reanudación de carrera; además de marcas, crestas de cantera, tablas, ojeadores, retransmisión y vista móvil.


## UI V3 — Matchday Journal (3 noviembre 2026)

**Idea creativa:** un simulador de carrera contado como una *revista deportiva interactiva*. La identidad mantiene el azul marino y el verde esmeralda, pero gana personalidad con titulares tipográficos, ritmos de composición y atmósfera de estadio creada por CSS. Nada de fotos generadas ni tarjetas de relleno.

### Nueva capa visual

- \`assets/js/fls-personality-v3.js\`: mejora el DOM después del render de UI V2, sin alterar estado, reglas, persistencia, MatchLab V11 ni eventos. Cada pantalla es derivada del estado real.
- \`assets/css/fls-personality-v3.css\`: tipografía editorial, ambiente de estadio con gradientes y líneas, espacio negativo, variantes responsive y respeto por \`prefers-reduced-motion\`.
- **Inicio:** tarjeta MATCHDAY JOURNAL, escudos prominentes, rival local/visitante, acciones de la semana intactas, resumen del vestuario y «lo que está en juego» determinado por lesión, forma, confianza, cantera o interés de ojeadores.
- **Futbolista:** expediente / dorsal real del simulador, atributos auténticos destacados según su valor y escudo del club.
- **Mercado:** informe del representante con el club seguidor más avanzado (requisitos reales), sin inventar ofertas ni garantizar fichajes.
- **Noticias:** archivo editorial con entradas de \`S.inbox\` y numeración de crónicas.
- **Final de temporada / postpartido:** cabeceras que resumen estadísticas reales, sin alterar su resultado.
- **Identidad de club:** 30 paletas ilustrativas asignadas explícitamente a equipos populares, nunca asumidas automáticamente como colores oficiales para clubes desconocidos. El verde esmeralda sigue siendo el color de las acciones de juego.

### Escudos

La lista \`LEAGUES\` contiene 482 clubes. El catálogo tiene una ruta SVG identificada para 479 (**99,4 %**); los tres restantes son \`SuperSport United\`, \`Cape Town City\` y \`Royal AM\` (Sudáfrica). Todos conservan fallback de iniciales.

Las canteras \`Sub-19\` usan el SVG del club matriz. SVG de Future FC utiliza el del mismo club tras su cambio de nombre a Modern Sport FC (2024). Las imágenes se cargan remotamente; no hay dependencias de red para guardar partidas o simular partidos. Se mantiene la posibilidad de mostrar iniciales si el recurso falla.

### Checklist de calidad

El workflow \`fls-ui.yml\` ejecuta las pruebas de \`tests/fls-ui-smoke.mjs\` en Chromium y adjunta una galería temporal de capturas (inicio, academias, mercado, jugador, noticias, móvil). El workflow V11 comprueba además la continuidad del motor 2D MatchLab. No fusionar una revisión sin ambas validaciones correctas.

**Compatibilidad:** se mantiene la clave de guardado \`fuera_de_guion_carrera_v4\`. No se toca \`core.js\`, \`match-v11.js\` ni su integración. Los titulares de ambiente no añaden resultados, rumores ni noticias falsas a la simulación.

## UI V4 — Precision Layout & Visual QA (3 noviembre 2026)

**Objetivo:** una retícula consistente para todas las pantallas, centrados reales, controles accesibles y adaptación a monitores, tabletas y móviles.

### Diseño
- CSS de precisión: assets/css/fls-precision-v4.css. Unifica anchura máxima de 1248 px, márgenes fluidos, tipografía y espaciado de tarjetas, navegación, entrenamiento, vida, jugador, mercado, noticias, tablas y resultados.
- Marcadores y enfrentamientos con columnas simétricas: el VS o resultado se centra geométricamente entre los escudos. Se conserva el terreno de juego 2D de MatchLab V11.2.
- Barra móvil de seis acciones con botones amplios, marca corta Football Life y ajustes para 320, 375, 768, 1024 y 1920 px.
- Adaptador de UI: assets/js/fls-precision-v4.js. Incluye aria-current, aria-label y estados semánticos del progreso del encuentro, sin cambiar el estado de carrera.
- Preferencia de movimiento reducido y estilo de foco visible.

### Compatibilidad
- Sin cambios en core.js, match-v11.js, match-v11-launch.js, role-progression-v11.js ni en la clave de guardado fuera_de_guion_carrera_v4.
- Escudos SVG y personalidad visual V3 conservados.

### QA
- 11 pruebas funcionales de carrera y UI: tests/fls-ui-smoke.mjs.
- **61 auditorías geométricas** con Chromium en tests/fls-layout-audit.mjs: comprueban desbordamientos del documento, centrado del área principal, de enfrentamientos y de marcadores, y límites horizontales de contenedores importantes en 10 resoluciones de 320 a 1920 px.
- Capturas automáticas de alta y baja resolución, fichero layout-report.json y reportes de error en el artefacto temporal football-life-ui-v4-layout-gallery de GitHub Actions (retención siete días).
- Las pruebas confirman alineación técnica, pero no sustituyen una revisión humana de las capturas para valorar la calidad artística.

## UI V5 — Experiencia semanal (3 de noviembre de 2026)

### Motivo
La carrera incorpora entrenamiento, vida personal y partido como tres etapas diferenciadas, pero su continuidad visual y el progreso de las acciones no eran evidentes. Este parche mejora la claridad y el aspecto editorial sin tocar las reglas.

### Cambios
- Una línea de recorrido con tres etapas, derivada de S.day.index, S.week y S.day.answers. Nunca permite saltarse acciones ni altera la navegación existente.
- Preparación del día con marcador 0/2, 1/2 o 2/2: actividad y decisión contextual. Solo se marca como lista cuando el estado real del juego confirma las dos.
- Planes de entrenamiento y de vida personal con iconos y efectos explícitos: físico, confianza, concentración, moral, química, reputación y saldo, tomados directamente de TRAININGS y LIFE. No se inventan bonificaciones.
- Los costes de actividades pagadas se muestran antes de seleccionarlas; los controles del motor original siguen determinando si hay suficiente saldo.
- Previa del partido renovada: local/visitante, recorrido semanal completado y condición real del futbolista. No cambia convocatoria, alineación ni simulación.
- Corrección de interfaz móvil: la etiqueta de la situación deja de marcarse como resuelta por un evento del día anterior. Requiere la respuesta del día actual.
- Noticias: al no registrar temporada individualmente en cada mensaje, se oculta el identificador T calculado usando la temporada actual. El número de jornada se conserva sin presentar una temporada incorrecta.
- Archivo JS aislado en assets/js/fls-week-v5.js y estilos en assets/css/fls-week-v5.css, cargados después de V4. Sin cambio en core.js ni motor MatchLab.

### QA
- Nueva prueba tests/fls-week-v5.mjs: creación de carrera, entrenamiento 0→1→2, avance al segundo día, coste real y química en actividades, segundo día 0→1→2, previa del partido con estados reales, mobile 320–1440 y continuidad con MatchLab V11.3.
- Se mantienen los tests funcionales de 11 casos y las 61 auditorías de centrados de V4.
- Las capturas generadas automáticamente incluyen inicio y final del entrenamiento, vida personal, previa escritorio y móvil.

### Compatibilidad
El parche solo lee el estado S, las constantes de actividades y las imágenes ya existentes. No modifica las partidas guardadas, ni cambia probabilidades, atributos, resultados o reglas de MatchLab.
