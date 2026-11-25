# Reglas de UI para el SIH integrado (EDT + SIH)

1. **La imagen de referencia manda.** Si el usuario da una referencia, se copia tal cual: mismos bloques, mismos datos, mismo orden. No se agregan barras, leyendas, cumplimiento, tendencias ni textos de apoyo que no estén en la referencia, salvo que el usuario lo pida.
2. **Tarjetas en dos columnas como máximo**, separadas por una línea vertical. Cada bloque: icono + etiqueta + cifra principal arriba; desgloses en fila debajo, alineados en columnas iguales.
3. **Tamaños (tokens Cartillas):**
   - Etiqueta: 16 px regular, `neutral-600`.
   - Cifra principal: 28 px semibold, `neutral-700`.
   - Desglose: etiqueta 16 px `neutral-500`; cifra 20 px semibold (24 px en la tarjeta de infraestructura, ajuste pedido), `teal-600` (productividad) o el color de su categoría.
   - Espacios: 8, 12, 16, 20, 24 px. Nada de valores sueltos.
4. **Sin aire ni amontonado:** las columnas tienen el mismo ancho; ningún bloque deja más de un tercio de su ancho vacío; ninguna cifra se encima con otra.
5. **Sin datos inventados.** Si un dato no existe en el sistema (por ejemplo, planeado de hospitalizaciones), se marca «Sin meta» o «—», nunca se rellena.
6. **Antes de publicar:** captura completa de la vista en 1440 px, 1280 px y 390 px, revisada a ojo; medir que ningún bloque se encima con otro (entre bloques, no solo dentro de uno) y que la página no tenga desborde horizontal.
7. **Antes de cambiar algo no pedido, preguntar.** Los cambios de estructura o de contenido se proponen primero.
8. **Respetar Cartillas:** solo tokens (`--color-…`, `--space-…`, `--font-size-…`), sin colores ni tamaños literales en CSS nuevo.
