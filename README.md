# FUERA DE GUIÓN 7.0 — Fútbol en movimiento

Simulador ficticio de carrera futbolística, gratuito y sin cuentas, ejecutable en un navegador moderno. Empiezas con tres ofertas de cantera de distintos países y puedes desarrollar tu trayectoria, entrenar, negociar, vivir la prensa y disputar temporadas. Los clubes pueden tener nombres reales; los calendarios, las noticias, las estadísticas y los fichajes son **ficticios**.

## Jugar

**[Abrir juego en GitHub Pages](https://papimatcoding.github.io/football-player-career/)**. Como alternativa, publica esta carpeta en un servidor web estático (por ejemplo, `python -m http.server 8080`). El simulador no utiliza API externas.

## Novedades 7.0 — Prioridad: simulación

- Movimiento 2D basado en **líneas de formación, apoyo al balón, presión defensiva y posesiones enlazadas**, en lugar del movimiento aleatorio de los 22 jugadores de la versión 6. El campo continúa siendo una visualización estilizada, no un simulador físico ni táctico completo.
- Trayectorias diferenciadas para los centros, córners, remates, balones bloqueados y paradas. Los goles muestran una señal visible y se conservan en la cronología.
- **Cambio efectivo de campo al descanso**, incluidas las porterías y la dirección del ataque; el marcador mantiene el orden de local y visitante.
- Si el protagonista empieza **suplente**, el modo predeterminado muestra los acontecimientos relevantes de forma acelerada. Puedes alternar con el partido completo desde el inicio. Al llegar la sustitución, la simulación **se detiene** con un aviso y, tras confirmar, aparece tu jugador con su dorsal y un distintivo en el campo.
- Arreglada la pregunta de prensa que mostraba «1 goles» cuando el jugador había dado una asistencia. La entrevista usa los datos reales de la hoja de partido.
- Protegida la recarga durante retransmisiones antiguas: el inicializador no dibuja con el motor equivocado antes de que cargue el módulo de compatibilidad.
- Se mantiene el sistema de guardado y la clave **`fuera_de_guion_carrera_v4`** sin migraciones destructivas.

## Novedades 6.0

- **Retransmisión 2D fluida**: los jugadores, el balón y el campo se dibujan con `requestAnimationFrame`, sin recrear la página en cada fotograma.
- **Cinco minutos de partido** a velocidad 1× (más el tiempo que decidas pasar en el descanso), con velocidades 2× y 4× y modo de momentos importantes.
- **Partido simulado por eventos**: posesiones, pases, remates, paradas, fueras de juego, faltas directas e indirectas, córners, penaltis y tarjetas. Las estadísticas de la retransmisión proceden de las acciones simuladas; el campo las interpreta visualmente (no es un motor físico tridimensional).
- **Descanso obligatorio** a los 45', con estadísticas de la primera parte y botón para continuar.
- **Goles representados** con trayectoria a portería, marcador actualizado y feed de goles que no desaparece al desplazarse la cronología.
- **Prensa contextual** después de algunos partidos: debut, doblete, asistencia, mal rendimiento, expulsión, etc. En otros encuentros no hay rueda de prensa.
- **Noticias ficticias del mundo del fútbol** y ventanas de mercado aproximadas (verano/invierno), con filtros.
- **Decisiones contextuales** adicionales en entrenamientos y vida personal.

## Organización

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Entrada del juego y carga de módulos |
| `assets/js/core.js` | Trayectoria, liga, fichajes, temporadas y UI base |
| `assets/js/events.js` | Eventos del entorno del jugador |
| `assets/js/live-match.js` | Compatibilidad con retransmisiones empezadas en v5 |
| `assets/js/match-v6.js` | Simulación deportiva basada en eventos, canvas, reloj y estadísticas |
| `assets/js/world-v6.js` | Prensa contextual, noticias, ventanas de mercado |
| `assets/js/match-v7.js` | Presentación táctica y espacial, sustituciones y cambios de campo; compatible con el motor anterior |
| `assets/js/app.js` | Menú compacto, pantalla completa, scroll, compatibilidad |
| `assets/css/*.css` | Estilos base, juego en directo y mejoras v6 y v7 |
| `.github/workflows/pages.yml` | Despliegue de GitHub Pages desde `main` |

## Guardado y compatibilidad

**No se reinicia el progreso al actualizar de v5/v6 a v7.** La clave de almacenamiento continúa siendo `fuera_de_guion_carrera_v4` y el formato de datos sigue con `version:3`. Al abrir v6 por primera vez se conserva además una **instantánea previa a la actualización** en `fuera_de_guion_backup_antes_de_v6`. Una retransmisión ya iniciada en v5 puede completarse con su motor anterior antes de pasar a los partidos nuevos v6.

Para mayor seguridad, usa **Ajustes → Exportar partida** para descargar una copia JSON antes de cambiar de navegador, borrar la caché o jugar en modo privado. El guardado local de un HTML abierto como archivo y el de GitHub Pages no son el mismo origen. Las partidas no se guardan en GitHub ni se envían a servidores.

## Limitaciones intencionadas

El ritmo y las acciones en el campo constituyen una **visualización 2D aproximada**; las posiciones y movimientos no resuelven todas las leyes físicas ni un sistema táctico completo. El universo internacional se simula de forma ligera para que el juego funcione offline y en móviles. Las ventanas de mercado se aproximan por fase de temporada; las reglas reales de cada país no se replican exactamente.