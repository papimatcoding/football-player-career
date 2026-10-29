# FUERA DE GUIÓN — Simulador de carrera

Un simulador de carrera futbolística para el navegador, sin backend, con canteras internacionales, entrenamientos, decisiones fuera del campo, estadísticas y mercado de fichajes. Diseñado como juego ligero; no pretende representar un calendario oficial.

## Jugar

Abre `index.html` mediante un servidor local (por ejemplo, `python -m http.server 8080`) o visita GitHub Pages después de activar la publicación.

## Estructura

- `index.html`: punto de entrada.
- `assets/css/game.css`: estilos heredados de la versión 4.
- `assets/css/v5.css`: navegación compacta y retransmisión visual.
- `assets/js/core.js`: motor de carrera, canteras, clasificación y sistema original.
- `assets/js/events.js`: eventos condicionados por la situación del futbolista.
- `assets/js/live-match.js`: simulación y campo animado, reloj, narración y estadísticas.
- `assets/js/app.js`: navegación, scroll, pantalla completa y compatibilidad de partidas.

## Cómo se juega

1. Crea un futbolista y escoge una de las tres ofertas de cantera.
2. Cada jornada: entrenamiento → vida personal → partido.
3. Antes del partido, elige una consigna; durante el encuentro puedes pausar, acelerar o ir al final. No hay elecciones cada pocos minutos.
4. Revisa tus minutos, nota, acciones, resultados y el interés de los ojeadores.

El campo 2D representa una simulación **estilizada**, no un motor táctico/físico real. Los resultados y las estadísticas provienen de la simulación y las posiciones de los puntos son una visualización aproximada de la jugada.

## Guardado y privacidad

El progreso se guarda en `localStorage` cuando el navegador lo permite. Se pueden exportar/importar partidas JSON desde Ajustes. No hay cuentas ni servidores; los datos no salen de tu dispositivo.

## Publicación

Contiene un flujo de GitHub Actions para desplegar archivos estáticos. Para activarlo, en **Settings → Pages** elige **GitHub Actions** como fuente y ejecuta el workflow *Deploy GitHub Pages*. Si no se ha activado Pages en el repositorio, la primera ejecución puede necesitar esa configuración manual.