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
