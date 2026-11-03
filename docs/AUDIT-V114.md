# Football Life Simulator 11.4 — Auditoría del motor y HUD

## Correcciones funcionales

- El HUD y la nota del protagonista pasan a una franja **fuera del terreno de juego**, tanto en escritorio como en móvil. La información extensa se consulta al descanso y al final.
- Los porteros permanecen junto a **su propia portería** en córneres, faltas, saques de banda, penaltis y juego abierto. Se corrige un error anterior en la recolocación de faltas: el portero podía pasar por la rama de los jugadores de campo antes de la condición que protege a los guardametas.
- Ante una portería **realmente vacía** y un carril despejado, el poseedor considera un remate a mayor distancia; el intento conserva error y dificultad según distancia/ángulo. No hay goles garantizados ni paradas imposibles del guardameta cuando está muy lejos.
- La presión primaria se orienta desde el **lado de portería**, no desde detrás del atacante.
- La precisión del pase es más acorde con la habilidad y distancia; las recepciones e interceptaciones siguen ocurriendo físicamente, sin entregar el balón al receptor por teletransporte.

## Nota del futbolista

Es una fórmula **original del simulador**, no la puntuación oficial de FC. Goles, asistencias, pases completados, pases progresivos, pases clave, tiros a puerta, recuperaciones, duelos, paradas, metros reales con balón y portería a cero pueden sumar; pases fallados, pérdidas, faltas, ocasiones de xG alto desperdiciadas, goles encajados por portero, amarillas y expulsiones pueden restar. El peso varía de forma sencilla según la posición. El detalle se presenta únicamente al descanso y al final. La nota no se concede al suplente antes de entrar.

## Auditoría: 24 partidos completos deterministas

Muestra: 24 semillas reproducibles, Barcelona–Getafe con planes local equilibrado, ofensivo, defensivo, presión y tiki-taka; visitante equilibrado. Motor de 22 jugadores; cambio de campo al descanso, aproximadamente 2 minutos reales por parte. La muestra no es una liga profesional y los resultados no representan tasas reales de fútbol de 90 minutos.

| Métrica | Antes de calibrar el pase | 11.4 actual |
|---|---:|---:|
| Partidos auditados | 24 | 24 |
| Pases por partido, ambos equipos | 160,54 | 164,33 |
| % de pases completados | 63,53 % | 72,44 % |
| Remates por partido, ambos equipos | 13,38 | 13,88 |
| Goles por partido, ambos equipos | 2,50 | 3,08 |
| Tiros lejanos injustificados | 0 | 0 |
| Máximo alejamiento de un portero de su portería | 13,82 m | 13,76 m |
| Tiempo real aproximado por parte | 120,91 s | 120,69 s |
| Remates a portería vacía durante partidos normales | 0 | 0 |

Se realizaron **pruebas específicas de portería vacía** desplazando al guardameta rival fuera del área: el atacante reconoce el hueco y remata; con portero bien situado o dos defensas tapando la línea no fuerza el tiro. En partidos normales no se ven tiros a puerta vacía porque, tras el arreglo, los guardametas no suben caprichosamente.

**Limitaciones abiertas:** la tasa de pases sigue por debajo del fútbol de élite, no hay un motor predictivo completo de desmarques o anticipación del portero, y la calidad de las decisiones necesita contraste con más situaciones reales, no solo estadísticas agregadas. El motor sigue siendo un simulador táctico estilizado de cuatro minutos, no una reproducción literal de 90 minutos.

Pruebas reproducibles en `tests/audit-match-114.test.mjs`, `tests/career-intelligence-114.test.mjs`, `tests/browser-v11.mjs` y `npm test`. Las comprobaciones de navegador incluyen distinción HUD/campo y desglose de 12 métricas individuales.
